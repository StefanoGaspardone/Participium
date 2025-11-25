import * as f from "@test/e2e/lifecycle";
import { app } from "@app";
import request from "supertest";
import { AppDataSource } from "@database";
import { UserDAO } from "@daos/UserDAO";
import { CategoryDAO } from "@daos/CategoryDAO";
import { ReportDAO, ReportStatus } from "@daos/ReportDAO";
import { MessageDAO } from "@daos/MessagesDAO";

describe("Messages e2e tests", () => {
  let citizenToken: string;
  let techStaffToken: string;
  let citizenUserId: number;
  let techStaffUserId: number;
  let testReportId: number;

  beforeAll(async () => {
    // Initialize DB and populate test data (users, categories, offices)
    await f.default.beforeAll();

    // Login as the seeded citizen user
    const citizenLoginRes = await request(app)
      .post("/api/users/login")
      .send({ username: "user", password: "user" });
    expect(citizenLoginRes.status).toBe(200);
    citizenToken = citizenLoginRes.body.token;

    // Login as the seeded tech staff user
    const techLoginRes = await request(app)
      .post("/api/users/login")
      .send({ username: "techstaff", password: "techstaff" });
    expect(techLoginRes.status).toBe(200);
    techStaffToken = techLoginRes.body.token;

    // Repositories
    const userRepo = AppDataSource.getRepository(UserDAO);
    const categoryRepo = AppDataSource.getRepository(CategoryDAO);
    const reportRepo = AppDataSource.getRepository(ReportDAO);

    // Use seeded data from lifecycle
    const citizenUser = await userRepo.findOne({ where: { username: "user" } });
    const techStaffUser = await userRepo.findOne({ where: { username: "techstaff" } });
    const categories = await categoryRepo.find({ take: 1 });
    const category = categories[0];

    // Sanity: lifecycle must have provided these fixtures
    expect(citizenUser).toBeDefined();
    expect(techStaffUser).toBeDefined();
    expect(category).toBeDefined();

    citizenUserId = citizenUser!.id;
    techStaffUserId = techStaffUser!.id;

    // Create a test report for message tests
    const report = reportRepo.create({
      title: "E2E Test Report for Messages",
      description: "Test report for message e2e tests",
      category,
      images: ["https://example.com/test-image.jpg"],
      lat: 45.0703,
      long: 7.6869,
      status: ReportStatus.PendingApproval,
      anonymous: false,
      createdBy: citizenUser!,
    });
    const savedReport = await reportRepo.save(report);
    testReportId = savedReport.id;
  });

  afterAll(async () => {
    await f.default.afterAll();
  });

  describe("POST /api/messages", () => {
    it("should return 401 without authentication token", async () => {
      const messagePayload = {
        text: "Test message",
        receiverId: techStaffUserId,
        reportId: testReportId,
      };

      const res = await request(app).post("/api/messages").send(messagePayload);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
    });

    it("should return 400 when text is missing", async () => {
      const invalidPayload = {
        receiverId: techStaffUserId,
        reportId: testReportId,
      };

      const res = await request(app)
        .post("/api/messages")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/text is required/i);
    });

    it("should return 400 when text is not a string", async () => {
      const invalidPayload = {
        text: 123,
        receiverId: techStaffUserId,
        reportId: testReportId,
      };

      const res = await request(app)
        .post("/api/messages")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/text/i);
    });

    it("should return 400 when receiverId is missing", async () => {
      const invalidPayload = {
        text: "Test message",
        reportId: testReportId,
      };

      const res = await request(app)
        .post("/api/messages")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/receiverId is required/i);
    });

    it("should return 400 when receiverId is not a number", async () => {
      const invalidPayload = {
        text: "Test message",
        receiverId: "not-a-number",
        reportId: testReportId,
      };

      const res = await request(app)
        .post("/api/messages")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/receiverId/i);
    });

    it("should return 400 when reportId is missing", async () => {
      const invalidPayload = {
        text: "Test message",
        receiverId: techStaffUserId,
      };

      const res = await request(app)
        .post("/api/messages")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/reportId is required/i);
    });

    it("should return 400 when reportId is not a number", async () => {
      const invalidPayload = {
        text: "Test message",
        receiverId: techStaffUserId,
        reportId: "invalid",
      };

      const res = await request(app)
        .post("/api/messages")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/reportId/i);
    });

    it("should return 404 when receiver does not exist", async () => {
      const invalidPayload = {
        text: "Test message",
        receiverId: 999999,
        reportId: testReportId,
      };

      const res = await request(app)
        .post("/api/messages")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(invalidPayload);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/receiver not found/i);
    });

    it("should return 404 when report does not exist", async () => {
      const invalidPayload = {
        text: "Test message",
        receiverId: techStaffUserId,
        reportId: 999999,
      };

      const res = await request(app)
        .post("/api/messages")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(invalidPayload);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/report not found/i);
    });

    it("should return 201 and create message with valid data from citizen", async () => {
      const validPayload = {
        text: "Hello from citizen",
        receiverId: techStaffUserId,
        reportId: testReportId,
      };

      const res = await request(app)
        .post("/api/messages")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("text", "Hello from citizen");
      expect(res.body).toHaveProperty("sender");
      expect(res.body.sender.id).toBe(citizenUserId);
      expect(res.body).toHaveProperty("receiver");
      expect(res.body.receiver.id).toBe(techStaffUserId);
      expect(res.body).toHaveProperty("report");
      expect(res.body.report.id).toBe(testReportId);
      expect(res.body).toHaveProperty("sentAt");

      // Verify message was persisted in database
      const messageRepo = AppDataSource.getRepository(MessageDAO);
      const savedMessage = await messageRepo.findOne({
        where: { text: "Hello from citizen" },
        relations: ["sender", "receiver", "report"],
      });

      expect(savedMessage).toBeDefined();
      expect(savedMessage!.sender.id).toBe(citizenUserId);
      expect(savedMessage!.receiver.id).toBe(techStaffUserId);
      expect(savedMessage!.report.id).toBe(testReportId);
    });

    it("should return 201 and create message with valid data from tech staff", async () => {
      const validPayload = {
        text: "Hello from tech staff",
        receiverId: citizenUserId,
        reportId: testReportId,
      };

      const res = await request(app)
        .post("/api/messages")
        .set("Authorization", `Bearer ${techStaffToken}`)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("text", "Hello from tech staff");
      expect(res.body.sender.id).toBe(techStaffUserId);
      expect(res.body.receiver.id).toBe(citizenUserId);
    });
  });

  describe("GET /api/messages/report/:id", () => {
    beforeAll(async () => {
      // Create some test messages for this report
      const messageRepo = AppDataSource.getRepository(MessageDAO);
      const userRepo = AppDataSource.getRepository(UserDAO);
      const reportRepo = AppDataSource.getRepository(ReportDAO);

      const sender = await userRepo.findOne({ where: { id: citizenUserId } });
      const receiver = await userRepo.findOne({ where: { id: techStaffUserId } });
      const report = await reportRepo.findOne({ where: { id: testReportId } });

      const message1 = messageRepo.create({
        text: "First message in report",
        sender: sender!,
        receiver: receiver!,
        report: report!,
      });

      const message2 = messageRepo.create({
        text: "Second message in report",
        sender: receiver!,
        receiver: sender!,
        report: report!,
      });

      await messageRepo.save([message1, message2]);
    });

    it("should return 401 without authentication token", async () => {
      const res = await request(app).get(`/api/messages/report/${testReportId}`);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
    });

    it("should return 400 for invalid report ID", async () => {
      const res = await request(app)
        .get("/api/messages/report/invalid")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toBe("Invalid report ID");
    });

    it("should return 200 and list messages for valid report ID with citizen token", async () => {
      const res = await request(app)
        .get(`/api/messages/report/${testReportId}`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("messages");
      expect(Array.isArray(res.body.messages)).toBe(true);
      expect(res.body.messages.length).toBeGreaterThan(0);
    });

    it("should return 200 and list messages for valid report ID with tech staff token", async () => {
      const res = await request(app)
        .get(`/api/messages/report/${testReportId}`)
        .set("Authorization", `Bearer ${techStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("messages");
      expect(Array.isArray(res.body.messages)).toBe(true);
    });

    it("should return messages with correct DTO structure", async () => {
      const res = await request(app)
        .get(`/api/messages/report/${testReportId}`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);

      if (res.body.messages.length > 0) {
        const message = res.body.messages[0];
        expect(message).toHaveProperty("id");
        expect(typeof message.id).toBe("number");
        expect(message).toHaveProperty("text");
        expect(typeof message.text).toBe("string");
        expect(message).toHaveProperty("sender");
        expect(message.sender).toHaveProperty("id");
        expect(message).toHaveProperty("receiver");
        expect(message.receiver).toHaveProperty("id");
        expect(message).toHaveProperty("report");
        expect(message.report).toHaveProperty("id");
        expect(message).toHaveProperty("sentAt");
      }
    });

    it("should return messages ordered by sentAt in ascending order", async () => {
      const res = await request(app)
        .get(`/api/messages/report/${testReportId}`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);

      if (res.body.messages.length > 1) {
        const messages = res.body.messages;
        for (let i = 1; i < messages.length; i++) {
          const prevDate = new Date(messages[i - 1].sentAt);
          const currDate = new Date(messages[i].sentAt);
          expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
        }
      }
    });
  });

  describe("GET /api/messages", () => {
    it("should return 401 without authentication token", async () => {
      const res = await request(app).get("/api/messages");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
    });

    it("should return 200 and list chats for authenticated citizen user", async () => {
      const res = await request(app)
        .get("/api/messages")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("chats");
      expect(Array.isArray(res.body.chats)).toBe(true);
    });

    it("should return 200 and list chats for authenticated tech staff user", async () => {
      const res = await request(app)
        .get("/api/messages")
        .set("Authorization", `Bearer ${techStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("chats");
      expect(Array.isArray(res.body.chats)).toBe(true);
    });

    it("should return chats with correct DTO structure", async () => {
      const res = await request(app)
        .get("/api/messages")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);

      if (res.body.chats.length > 0) {
        const chat = res.body.chats[0];
        expect(chat).toHaveProperty("report");
        expect(chat.report).toHaveProperty("id");
        expect(chat.report).toHaveProperty("title");
        expect(chat.report).toHaveProperty("category");
        expect(chat).toHaveProperty("users");
        expect(Array.isArray(chat.users)).toBe(true);
        expect(chat.users.length).toBe(2);
        expect(chat).toHaveProperty("messages");
        expect(Array.isArray(chat.messages)).toBe(true);
      }
    });

    it("should return chats sorted by last message time (newest first)", async () => {
      const res = await request(app)
        .get("/api/messages")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);

      if (res.body.chats.length > 1) {
        const chats = res.body.chats;
        for (let i = 1; i < chats.length; i++) {
          const prevLastMsg = chats[i - 1].messages[chats[i - 1].messages.length - 1];
          const currLastMsg = chats[i].messages[chats[i].messages.length - 1];
          const prevDate = new Date(prevLastMsg.sentAt);
          const currDate = new Date(currLastMsg.sentAt);
          expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
        }
      }
    });

    it("should include messages from both sent and received conversations", async () => {
      const res = await request(app)
        .get("/api/messages")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.chats.length).toBeGreaterThan(0);

      // Find a chat and verify it contains messages where citizen is both sender and receiver
      const chatsWithMultipleMessages = res.body.chats.filter((chat: any) => chat.messages.length > 1);
      
      if (chatsWithMultipleMessages.length > 0) {
        const chat = chatsWithMultipleMessages[0];
        const senderIds = chat.messages.map((msg: any) => msg.sender.id);
        const uniqueSenders = [...new Set(senderIds)];
        expect(uniqueSenders.length).toBeGreaterThan(1); // Messages from different users
      }
    });
  });
});
