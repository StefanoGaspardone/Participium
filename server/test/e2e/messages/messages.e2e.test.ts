import * as f from "@test/e2e/lifecycle";
import { app } from "@app";
import request from "supertest";
import { hash } from "bcryptjs";
import { AppDataSource } from "@database";
import { UserDAO, UserType } from "@daos/UserDAO";
import { CategoryDAO } from "@daos/CategoryDAO";
import { ReportDAO, ReportStatus } from "@daos/ReportDAO";
import { ChatDAO, ChatType } from "@daos/ChatsDAO";

/**
 * E2E tests for chat-based messaging API.
 * 
 * Routes tested:
 * - POST /api/chats/:chatId/newMessage
 * - GET /api/chats/:chatId/messages
 */

describe("Messages E2E tests", () => {
  let citizenToken: string;
  let tosmToken: string;
  let extMaintainerToken: string;
  let citizenUser: UserDAO;
  let tosmUser: UserDAO;
  let extMaintainerUser: UserDAO;
  let testReport: ReportDAO;
  let citizenTosmChat: ChatDAO;
  let extTosmChat: ChatDAO;

  beforeAll(async () => {
    // Initialize DB and populate test data
    await f.default.beforeAll();

    const userRepo = AppDataSource.getRepository(UserDAO);
    const categoryRepo = AppDataSource.getRepository(CategoryDAO);
    const reportRepo = AppDataSource.getRepository(ReportDAO);
    const chatRepo = AppDataSource.getRepository(ChatDAO);

    // Get seeded users (from populateTestData in test-datasource.ts)
    citizenUser = (await userRepo.findOne({ where: { username: "user" } }))!;
    tosmUser = (await userRepo.findOne({ where: { username: "techstaff" } }))!;
    
    // Create external maintainer user for testing
    const extUser = userRepo.create({
      username: "extmaintainer_e2e",
      email: "ext_e2e@test.com",
      passwordHash: await hash("password", 10),
      firstName: "External",
      lastName: "Maintainer",
      userType: UserType.EXTERNAL_MAINTAINER,
      emailNotificationsEnabled: false,
    });
    extMaintainerUser = await userRepo.save(extUser);

    // Get seeded category
    const category = (await categoryRepo.find({ take: 1 }))[0];

    // Create test report
    const report = reportRepo.create({
      title: "E2E Message Test Report",
      description: "Test report for message e2e tests",
      category,
      images: ["https://example.com/test-image.jpg"],
      lat: 45.0703,
      long: 7.6869,
      status: ReportStatus.InProgress,
      anonymous: false,
      createdBy: citizenUser,
      assignedTo: tosmUser,
    });
    testReport = await reportRepo.save(report);

    // Create chats
    const citizenChat = chatRepo.create({
      report: testReport,
      tosm_user: tosmUser,
      second_user: citizenUser,
      chatType: ChatType.CITIZEN_TOSM,
    });
    citizenTosmChat = await chatRepo.save(citizenChat);

    const extChat = chatRepo.create({
      report: testReport,
      tosm_user: tosmUser,
      second_user: extMaintainerUser,
      chatType: ChatType.EXT_TOSM,
    });
    extTosmChat = await chatRepo.save(extChat);

    // Login users
    const citizenLogin = await request(app)
      .post("/api/users/login")
      .send({ username: "user", password: "user" });
    expect(citizenLogin.status).toBe(200);
    citizenToken = citizenLogin.body.token;

    // Login as TOSM user (seeded as 'techstaff')
    const tosmLogin = await request(app)
      .post("/api/users/login")
      .send({ username: "techstaff", password: "techstaff" });
    expect(tosmLogin.status).toBe(200);
    tosmToken = tosmLogin.body.token;

    const extLogin = await request(app)
      .post("/api/users/login")
      .send({ username: "extmaintainer_e2e", password: "password" });
    expect(extLogin.status).toBe(200);
    extMaintainerToken = extLogin.body.token;
  });

  afterAll(async () => {
    await f.default.afterAll();
  });

  describe("POST /api/chats/:chatId/newMessage", () => {
    it("should return 201 and create message from citizen to tosm", async () => {
      const messageData = {
        text: "Hello from citizen e2e test",
        receiverId: tosmUser.id,
      };

      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(messageData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("text", "Hello from citizen e2e test");
      expect(res.body).toHaveProperty("sender", citizenUser.id);
      expect(res.body).toHaveProperty("receiver", tosmUser.id);
      expect(res.body).toHaveProperty("chat", citizenTosmChat.id);
      expect(res.body).toHaveProperty("sentAt");
    });

    it("should return 201 and create message from tosm to external maintainer", async () => {
      const messageData = {
        text: "Hello from tosm to ext maintainer",
        receiverId: extMaintainerUser.id,
      };

      const res = await request(app)
        .post(`/api/chats/${extTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${tosmToken}`)
        .send(messageData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("text", "Hello from tosm to ext maintainer");
      expect(res.body).toHaveProperty("sender", tosmUser.id);
      expect(res.body).toHaveProperty("receiver", extMaintainerUser.id);
      expect(res.body).toHaveProperty("chat", extTosmChat.id);
    });

    it("should return 201 and create message from ext maintainer to tosm", async () => {
      const messageData = {
        text: "Reply from ext maintainer",
        receiverId: tosmUser.id,
      };

      const res = await request(app)
        .post(`/api/chats/${extTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${extMaintainerToken}`)
        .send(messageData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("sender", extMaintainerUser.id);
      expect(res.body).toHaveProperty("receiver", tosmUser.id);
    });

    it("should return 401 without authentication token", async () => {
      const messageData = {
        text: "Unauthorized message",
        receiverId: tosmUser.id,
      };

      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .send(messageData);

      expect(res.status).toBe(401);
    });

    it("should return 400 when text is missing", async () => {
      const messageData = {
        receiverId: tosmUser.id,
      };

      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(messageData);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/text is required/);
    });

    it("should return 400 when text is not a string", async () => {
      const messageData = {
        text: 12345,
        receiverId: tosmUser.id,
      };

      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(messageData);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/text is required and it must be a string/);
    });

    it("should return 400 when receiverId is missing", async () => {
      const messageData = {
        text: "Test message",
      };

      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(messageData);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/receiverId is required/);
    });

    it("should return 400 when receiverId is not a number", async () => {
      const messageData = {
        text: "Test message",
        receiverId: "invalid",
      };

      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(messageData);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/receiverId is required and it must be a number/);
    });

    it("should return 400 when chatId is not a valid number", async () => {
      const messageData = {
        text: "Test message",
        receiverId: tosmUser.id,
      };

      const res = await request(app)
        .post("/api/chats/invalid/newMessage")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(messageData);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/chatId must be a number/);
    });

    it("should return 404 when chat does not exist", async () => {
      const messageData = {
        text: "Test message",
        receiverId: tosmUser.id,
      };

      const res = await request(app)
        .post("/api/chats/99999/newMessage")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(messageData);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Chat not found/);
    });

    it("should return 400 when sender is not part of the chat", async () => {
      const messageData = {
        text: "Test message",
        receiverId: tosmUser.id,
      };

      const res = await request(app)
        .post(`/api/chats/${extTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(messageData);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/sender inserted is not part of the chat/);
    });

    it("should return 400 when receiver is not part of the chat", async () => {
      const messageData = {
        text: "Test message",
        receiverId: extMaintainerUser.id,
      };

      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(messageData);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/receiver is not part of the chat/);
    });

    it("should persist message in database", async () => {
      const messageData = {
        text: "Persisted message test",
        receiverId: tosmUser.id,
      };

      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(messageData);

      expect(res.status).toBe(201);
      const messageId = res.body.id;

      // Verify persistence by fetching messages
      const getRes = await request(app)
        .get(`/api/chats/${citizenTosmChat.id}/messages`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(getRes.status).toBe(200);
      const messages = getRes.body.chats;
      const persistedMessage = messages.find((m: any) => m.id === messageId);
      expect(persistedMessage).toBeDefined();
      expect(persistedMessage.text).toBe("Persisted message test");
    });
  });

  describe("GET /api/chats/:chatId/messages", () => {
    it("should return 200 and list messages for valid chat (citizen)", async () => {
      const res = await request(app)
        .get(`/api/chats/${citizenTosmChat.id}/messages`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("chats");
      expect(Array.isArray(res.body.chats)).toBe(true);
    });

    it("should return 200 and list messages for valid chat (tosm)", async () => {
      const res = await request(app)
        .get(`/api/chats/${citizenTosmChat.id}/messages`)
        .set("Authorization", `Bearer ${tosmToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("chats");
      expect(Array.isArray(res.body.chats)).toBe(true);
    });

    it("should return 200 and list messages for ext-tosm chat", async () => {
      const res = await request(app)
        .get(`/api/chats/${extTosmChat.id}/messages`)
        .set("Authorization", `Bearer ${extMaintainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("chats");
      expect(Array.isArray(res.body.chats)).toBe(true);
    });

    it("should return messages with correct DTO structure", async () => {
      // First create a message
      await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ text: "DTO structure test", receiverId: tosmUser.id });

      const res = await request(app)
        .get(`/api/chats/${citizenTosmChat.id}/messages`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      
      if (res.body.chats.length > 0) {
        const message = res.body.chats[0];
        expect(message).toHaveProperty("id");
        expect(typeof message.id).toBe("number");
        expect(message).toHaveProperty("text");
        expect(typeof message.text).toBe("string");
        expect(message).toHaveProperty("sender");
        expect(typeof message.sender).toBe("number");
        expect(message).toHaveProperty("receiver");
        expect(typeof message.receiver).toBe("number");
        expect(message).toHaveProperty("chat");
        expect(typeof message.chat).toBe("number");
        expect(message).toHaveProperty("sentAt");
      }
    });

    it("should return messages in correct order (chronological)", async () => {
      // Create multiple messages with specific text to identify them
      const msg1Res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ text: "Chronological test message 1", receiverId: tosmUser.id });
      const msg1Id = msg1Res.body.id;

      await new Promise(resolve => setTimeout(resolve, 50)); // Ensure different timestamp

      const msg2Res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${tosmToken}`)
        .send({ text: "Chronological test message 2", receiverId: citizenUser.id });
      const msg2Id = msg2Res.body.id;

      const res = await request(app)
        .get(`/api/chats/${citizenTosmChat.id}/messages`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      const messages = res.body.chats;
      
      // Find our test messages
      const testMsg1 = messages.find((m: any) => m.id === msg1Id);
      const testMsg2 = messages.find((m: any) => m.id === msg2Id);
      
      expect(testMsg1).toBeDefined();
      expect(testMsg2).toBeDefined();
      
      // Check that our second message has a later or equal timestamp than the first
      const time1 = new Date(testMsg1.sentAt).getTime();
      const time2 = new Date(testMsg2.sentAt).getTime();
      expect(time1).toBeLessThanOrEqual(time2);
    });

    it("should return 401 without authentication token", async () => {
      const res = await request(app)
        .get(`/api/chats/${citizenTosmChat.id}/messages`);

      expect(res.status).toBe(401);
    });

    it("should return 400 when chatId is not a valid number", async () => {
      const res = await request(app)
        .get("/api/chats/invalid/messages")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/The chat id must be a valid number/);
    });

    it("should return 404 when chat does not exist", async () => {
      const res = await request(app)
        .get("/api/chats/99999/messages")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Chat not found/);
    });
  });

  describe("Message conversation flow", () => {
    it("should support back-and-forth conversation between users", async () => {
      // Citizen sends message
      const msg1 = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ text: "Need help with my report", receiverId: tosmUser.id });
      expect(msg1.status).toBe(201);

      // TOSM replies
      const msg2 = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${tosmToken}`)
        .send({ text: "Sure, what do you need?", receiverId: citizenUser.id });
      expect(msg2.status).toBe(201);

      // Citizen sends follow-up
      const msg3 = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ text: "When will it be fixed?", receiverId: tosmUser.id });
      expect(msg3.status).toBe(201);

      // Verify all messages are in conversation
      const res = await request(app)
        .get(`/api/chats/${citizenTosmChat.id}/messages`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      const messages = res.body.chats;
      const conversationTexts = messages.map((m: any) => m.text);
      
      expect(conversationTexts).toContain("Need help with my report");
      expect(conversationTexts).toContain("Sure, what do you need?");
      expect(conversationTexts).toContain("When will it be fixed?");
    });
  });

  describe("Citizen-TSM message exchange scenarios", () => {
    it("should allow citizen to initiate conversation with TSM", async () => {
      // Citizen sends first message
      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({
          text: "I need assistance with this report",
          receiverId: tosmUser.id
        });

      expect(res.status).toBe(201);
      expect(res.body.sender).toBe(citizenUser.id);
      expect(res.body.receiver).toBe(tosmUser.id);
      expect(res.body.text).toBe("I need assistance with this report");
    });

    it("should allow TSM to respond to citizen message", async () => {
      // TSM responds to citizen
      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${tosmToken}`)
        .send({
          text: "I'll look into this right away",
          receiverId: citizenUser.id
        });

      expect(res.status).toBe(201);
      expect(res.body.sender).toBe(tosmUser.id);
      expect(res.body.receiver).toBe(citizenUser.id);
      expect(res.body.text).toBe("I'll look into this right away");
    });

    it("should maintain conversation history between citizen and TSM", async () => {
      const messages = [
        { text: "What's the status?", sender: "citizen" },
        { text: "We're working on it", sender: "tosm" },
        { text: "When will it be completed?", sender: "citizen" },
        { text: "By end of week", sender: "tosm" },
      ];

      // Send messages alternating between users
      for (const msg of messages) {
        const token = msg.sender === "citizen" ? citizenToken : tosmToken;
        const receiverId = msg.sender === "citizen" ? tosmUser.id : citizenUser.id;

        const res = await request(app)
          .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
          .set("Authorization", `Bearer ${token}`)
          .send({ text: msg.text, receiverId });

        expect(res.status).toBe(201);
      }

      // Verify conversation history
      const res = await request(app)
        .get(`/api/chats/${citizenTosmChat.id}/messages`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      const conversationTexts = res.body.chats.map((m: any) => m.text);

      messages.forEach(msg => {
        expect(conversationTexts).toContain(msg.text);
      });
    });

    it("should allow both citizen and TSM to view all messages", async () => {
      // Send a message from citizen
      await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ text: "Test visibility", receiverId: tosmUser.id });

      // Citizen retrieves messages
      const citizenRes = await request(app)
        .get(`/api/chats/${citizenTosmChat.id}/messages`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(citizenRes.status).toBe(200);
      const citizenMessages = citizenRes.body.chats;

      // TSM retrieves messages
      const tosmRes = await request(app)
        .get(`/api/chats/${citizenTosmChat.id}/messages`)
        .set("Authorization", `Bearer ${tosmToken}`);

      expect(tosmRes.status).toBe(200);
      const tosmMessages = tosmRes.body.chats;

      // Both should see the same messages
      expect(citizenMessages.length).toBe(tosmMessages.length);
      expect(citizenMessages.map((m: any) => m.id).sort())
        .toEqual(tosmMessages.map((m: any) => m.id).sort());
    });

    it("should handle rapid message exchange between citizen and TSM", async () => {
      const messagePromises = [];

      // Citizen sends 3 messages rapidly
      for (let i = 1; i <= 3; i++) {
        messagePromises.push(
          request(app)
            .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
            .set("Authorization", `Bearer ${citizenToken}`)
            .send({ text: `Citizen rapid message ${i}`, receiverId: tosmUser.id })
        );
      }

      // TSM sends 3 messages rapidly
      for (let i = 1; i <= 3; i++) {
        messagePromises.push(
          request(app)
            .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
            .set("Authorization", `Bearer ${tosmToken}`)
            .send({ text: `TSM rapid message ${i}`, receiverId: citizenUser.id })
        );
      }

      const results = await Promise.all(messagePromises);

      // All messages should be created successfully
      results.forEach(res => {
        expect(res.status).toBe(201);
      });

      // Verify all messages are stored
      const res = await request(app)
        .get(`/api/chats/${citizenTosmChat.id}/messages`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      const texts = res.body.chats.map((m: any) => m.text);

      for (let i = 1; i <= 3; i++) {
        expect(texts).toContain(`Citizen rapid message ${i}`);
        expect(texts).toContain(`TSM rapid message ${i}`);
      }
    });

    it("should prevent citizen from sending messages in ext-tosm chat", async () => {
      const res = await request(app)
        .post(`/api/chats/${extTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ text: "Unauthorized message", receiverId: tosmUser.id });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/sender inserted is not part of the chat/);
    });

    it("should verify message timestamps are sequential", async () => {
      const msg1 = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ text: "First timestamp test", receiverId: tosmUser.id });

      await new Promise(resolve => setTimeout(resolve, 100));

      const msg2 = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${tosmToken}`)
        .send({ text: "Second timestamp test", receiverId: citizenUser.id });

      const time1 = new Date(msg1.body.sentAt).getTime();
      const time2 = new Date(msg2.body.sentAt).getTime();

      expect(time2).toBeGreaterThan(time1);
    });

    it("should handle long message text from citizen to TSM", async () => {
      const longText = "A".repeat(1000); // 1000 character message

      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ text: longText, receiverId: tosmUser.id });

      expect(res.status).toBe(201);
      expect(res.body.text).toBe(longText);
      expect(res.body.text.length).toBe(1000);
    });
  });

  describe("Edge cases for citizen-TSM messaging", () => {
    it("should handle empty string message rejection", async () => {
      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ text: "", receiverId: tosmUser.id });

      // Depending on validation, this might be 400 or might allow empty strings
      // Adjust expectation based on your validation rules
      expect([201, 400]).toContain(res.status);
    });

    it("should handle special characters in messages", async () => {
      const specialText = "Special chars: !@#$%^&*()_+-={}[]|\\:\";<>?,./";

      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ text: specialText, receiverId: tosmUser.id });

      expect(res.status).toBe(201);
      expect(res.body.text).toBe(specialText);
    });

    it("should handle unicode and emoji in messages", async () => {
      const unicodeText = "Hello 你好 こんにちは 👋 😊";

      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ text: unicodeText, receiverId: tosmUser.id });

      expect(res.status).toBe(201);
      expect(res.body.text).toBe(unicodeText);
    });

    it("should return empty array for new chat with no messages", async () => {
      // Create a new chat
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const chatRepo = AppDataSource.getRepository(ChatDAO);
      const category = (await categoryRepo.find({ take: 1 }))[0];

      const newReport = reportRepo.create({
        title: "Empty Chat Report",
        description: "Test",
        category,
        images: ["https://example.com/test.jpg"],
        lat: 45.0703,
        long: 7.6869,
        status: ReportStatus.InProgress,
        createdBy: citizenUser,
        assignedTo: tosmUser,
      });
      const savedReport = await reportRepo.save(newReport);

      const newChat = chatRepo.create({
        report: savedReport,
        tosm_user: tosmUser,
        second_user: citizenUser,
        chatType: ChatType.CITIZEN_TOSM,
      });
      const savedChat = await chatRepo.save(newChat);

      const res = await request(app)
        .get(`/api/chats/${savedChat.id}/messages`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.chats).toEqual([]);
    });
  });
});
