import * as f from "@test/e2e/lifecycle";
import { app } from "@app";
import request from "supertest";
import { hash } from "bcryptjs";
import { AppDataSource } from "@database";
import { UserDAO, UserType } from "@daos/UserDAO";
import { CategoryDAO } from "@daos/CategoryDAO";
import { ReportDAO, ReportStatus } from "@daos/ReportDAO";
import { ChatType } from "@daos/ChatsDAO";

const TEST_PASSWORD = 'password'; //NOSONAR
const USER_PASSWORD = 'user'; //NOSONAR
const TECHSTAFF_PASSWORD = 'techstaff'; //NOSONAR

/**
 * E2E tests for chat management API.
 * 
 * Routes tested:
 * - POST /api/chats
 * - GET /api/chats
 * - GET /api/chats/report/:reportId
 * - GET /api/chats/:chatId
 */

describe("Chats E2E tests", () => {
  let citizenToken: string;
  let tosmToken: string;
  let extMaintainerToken: string;
  let anotherCitizenToken: string;
  let citizenUser: UserDAO;
  let tosmUser: UserDAO;
  let extMaintainerUser: UserDAO;
  let anotherCitizenUser: UserDAO;
  let testReport1: ReportDAO;
  let testReport2: ReportDAO;

  beforeAll(async () => {
    // Initialize DB and populate test data
    await f.default.beforeAll();

    const userRepo = AppDataSource.getRepository(UserDAO);
    const categoryRepo = AppDataSource.getRepository(CategoryDAO);
    const reportRepo = AppDataSource.getRepository(ReportDAO);

    // Get seeded users (from populateTestData in test-datasource.ts)
    citizenUser = (await userRepo.findOne({ where: { username: "user" } }))!;
    tosmUser = (await userRepo.findOne({ where: { username: "techstaff" } }))!;

    // Create additional users for testing
    const extUser = userRepo.create({
      username: "extmaintainer_chat_e2e",
      email: "ext_chat_e2e@test.com",
      passwordHash: await hash(TEST_PASSWORD, 10),
      firstName: "External",
      lastName: "Maintainer",
      userType: UserType.EXTERNAL_MAINTAINER,
      emailNotificationsEnabled: false,
    });
    extMaintainerUser = await userRepo.save(extUser);

    const anotherCitizen = userRepo.create({
      username: "citizen2_chat_e2e",
      email: "citizen2_chat_e2e@test.com",
      passwordHash: await hash(TEST_PASSWORD, 10),
      firstName: "Another",
      lastName: "Citizen",
      userType: UserType.CITIZEN,
      emailNotificationsEnabled: false,
    });
    anotherCitizenUser = await userRepo.save(anotherCitizen);

    // Get seeded category
    const category = (await categoryRepo.find({ take: 1 }))[0];

    // Create test reports
    const report1 = reportRepo.create({
      title: "E2E Chat Test Report 1",
      description: "Test report 1 for chat e2e tests",
      category,
      images: ["https://example.com/test-image1.jpg"],
      lat: 45.0703,
      long: 7.6869,
      status: ReportStatus.InProgress,
      anonymous: false,
      createdBy: citizenUser,
      assignedTo: tosmUser,
    });
    testReport1 = await reportRepo.save(report1);

    const report2 = reportRepo.create({
      title: "E2E Chat Test Report 2",
      description: "Test report 2 for chat e2e tests",
      category,
      images: ["https://example.com/test-image2.jpg"],
      lat: 45.0703,
      long: 7.6869,
      status: ReportStatus.PendingApproval,
      anonymous: false,
      createdBy: anotherCitizenUser,
    });
    testReport2 = await reportRepo.save(report2);

    // Login users
    const citizenLogin = await request(app)
      .post("/api/users/login")
      .send({ username: "user", password: USER_PASSWORD });
    expect(citizenLogin.status).toBe(200);
    citizenToken = citizenLogin.body.token;

    // Login as TOSM user (seeded as 'techstaff')
    const tosmLogin = await request(app)
      .post("/api/users/login")
      .send({ username: "techstaff", password: TECHSTAFF_PASSWORD });
    expect(tosmLogin.status).toBe(200);
    tosmToken = tosmLogin.body.token;

    const extLogin = await request(app)
      .post("/api/users/login")
      .send({ username: "extmaintainer_chat_e2e", password: TEST_PASSWORD });
    expect(extLogin.status).toBe(200);
    extMaintainerToken = extLogin.body.token;

    const anotherCitizenLogin = await request(app)
      .post("/api/users/login")
      .send({ username: "citizen2_chat_e2e", password: TEST_PASSWORD });
    expect(anotherCitizenLogin.status).toBe(200);
    anotherCitizenToken = anotherCitizenLogin.body.token;
  });

  afterAll(async () => {
    await f.default.afterAll();
  });

  describe("POST /api/chats", () => {
    it("should return 201 and create CITIZEN_TOSM chat when citizen creates chat", async () => {
      const chatData = {
        secondUserId: tosmUser.id,
        reportId: testReport2.id,
      };

      const res = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${anotherCitizenToken}`)
        .send(chatData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("chatType", ChatType.CITIZEN_TOSM);
      expect(res.body.tosm_user.id).toBe(tosmUser.id);
      expect(res.body.second_user.id).toBe(anotherCitizenUser.id);
      expect(res.body.report.id).toBe(testReport2.id);
    });

    it("should return 201 and create EXT_TOSM chat when external maintainer creates chat", async () => {
      const chatData = {
        secondUserId: tosmUser.id,
        reportId: testReport1.id,
      };

      const res = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${extMaintainerToken}`)
        .send(chatData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("chatType", ChatType.EXT_TOSM);
      expect(res.body.tosm_user.id).toBe(tosmUser.id);
      expect(res.body.second_user.id).toBe(extMaintainerUser.id);
      expect(res.body.report.id).toBe(testReport1.id);
    });

    it("should return 201 and create CITIZEN_TOSM chat when tosm creates chat with citizen", async () => {
      // Create another report for this test
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const category = (await categoryRepo.find({ take: 1 }))[0];
      
      const newReport = reportRepo.create({
        title: "TOSM Created Chat Report",
        description: "Test report",
        category,
        images: ["https://example.com/test.jpg"],
        lat: 45.0703,
        long: 7.6869,
        status: ReportStatus.InProgress,
        createdBy: citizenUser,
        assignedTo: tosmUser,
      });
      const savedReport = await reportRepo.save(newReport);

      const chatData = {
        secondUserId: citizenUser.id,
        reportId: savedReport.id,
      };

      const res = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${tosmToken}`)
        .send(chatData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("chatType", ChatType.CITIZEN_TOSM);
    });

    it("should return 401 without authentication token", async () => {
      const chatData = {
        secondUserId: tosmUser.id,
        reportId: testReport1.id,
      };

      const res = await request(app)
        .post("/api/chats")
        .send(chatData);

      expect(res.status).toBe(401);
    });

    it("should return 400 when secondUserId is missing", async () => {
      const chatData = {
        reportId: testReport1.id,
      };

      const res = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(chatData);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/id of the other chat user must be specified/);
    });

    it("should return 400 when reportId is missing", async () => {
      const chatData = {
        secondUserId: tosmUser.id,
      };

      const res = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(chatData);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/id of the report the chat is attached to must be specified/);
    });

    it("should return 404 when tosm user not found", async () => {
      const chatData = {
        secondUserId: 99999,
        reportId: testReport1.id,
      };

      const res = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(chatData);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/TOSM specified not found/);
    });

    it("should return 404 when report not found", async () => {
      const chatData = {
        secondUserId: tosmUser.id,
        reportId: 99999,
      };

      const res = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(chatData);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/specified report not found/);
    });

    it("should persist chat in database", async () => {
      // Create another report for this test
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const category = (await categoryRepo.find({ take: 1 }))[0];
      
      const persistReport = reportRepo.create({
        title: "Persistence Test Report",
        description: "Test",
        category,
        images: ["https://example.com/test.jpg"],
        lat: 45.0703,
        long: 7.6869,
        status: ReportStatus.InProgress,
        createdBy: citizenUser,
        assignedTo: tosmUser,
      });
      const savedPersistReport = await reportRepo.save(persistReport);

      const chatData = {
        secondUserId: tosmUser.id,
        reportId: savedPersistReport.id,
      };

      const res = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(chatData);

      expect(res.status).toBe(201);
      const chatId = res.body.id;

      // Verify persistence by fetching the chat
      const getRes = await request(app)
        .get(`/api/chats/${chatId}`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.id).toBe(chatId);
      expect(getRes.body.report.id).toBe(savedPersistReport.id);
    });
  });

  describe("GET /api/chats", () => {
    it("should return 200 and list user chats for citizen", async () => {
      const res = await request(app)
        .get("/api/chats")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("should return 200 and list user chats for tosm", async () => {
      const res = await request(app)
        .get("/api/chats")
        .set("Authorization", `Bearer ${tosmToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("should return 200 and list user chats for external maintainer", async () => {
      const res = await request(app)
        .get("/api/chats")
        .set("Authorization", `Bearer ${extMaintainerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should return chats with correct DTO structure", async () => {
      const res = await request(app)
        .get("/api/chats")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      
      if (res.body.length > 0) {
        const chat = res.body[0];
        expect(chat).toHaveProperty("id");
        expect(typeof chat.id).toBe("number");
        expect(chat).toHaveProperty("chatType");
        expect(chat).toHaveProperty("tosm_user");
        expect(chat.tosm_user).toHaveProperty("id");
        expect(chat).toHaveProperty("second_user");
        expect(chat.second_user).toHaveProperty("id");
        expect(chat).toHaveProperty("report");
        expect(chat.report).toHaveProperty("id");
      }
    });

    it("should return only chats where user is a participant", async () => {
      const res = await request(app)
        .get("/api/chats")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      
      // Verify that all returned chats include the citizen user
      res.body.forEach((chat: any) => {
        const isTosm = chat.tosm_user.id === citizenUser.id;
        const isSecondUser = chat.second_user.id === citizenUser.id;
        expect(isTosm || isSecondUser).toBe(true);
      });
    });

    it("should return 401 without authentication token", async () => {
      const res = await request(app)
        .get("/api/chats");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/chats/report/:reportId", () => {
    it("should return 200 and list chats for a specific report", async () => {
      const res = await request(app)
        .get(`/api/chats/report/${testReport1.id}`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      
      // Verify all chats belong to the specified report
      res.body.forEach((chat: any) => {
        expect(chat.report.id).toBe(testReport1.id);
      });
    });

    it("should return 200 and empty array for report with no chats", async () => {
      // Create a report without chats
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const category = (await categoryRepo.find({ take: 1 }))[0];
      
      const noChatReport = reportRepo.create({
        title: "No Chats Report",
        description: "Test",
        category,
        images: ["https://example.com/test.jpg"],
        lat: 45.0703,
        long: 7.6869,
        status: ReportStatus.PendingApproval,
        createdBy: citizenUser,
      });
      const savedNoChatReport = await reportRepo.save(noChatReport);

      const res = await request(app)
        .get(`/api/chats/report/${savedNoChatReport.id}`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return 401 without authentication token", async () => {
      const res = await request(app)
        .get(`/api/chats/report/${testReport1.id}`);

      expect(res.status).toBe(401);
    });

    it("should return 400 when reportId is not a valid number", async () => {
      const res = await request(app)
        .get("/api/chats/report/invalid")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Report Id of the report the chats you want to retrieve are attached to must be a valid number/);
    });

    it("should return 404 when report not found", async () => {
      const res = await request(app)
        .get("/api/chats/report/99999")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Specified report was not found/);
    });

    it("should return chats for reports with multiple chat types", async () => {
      // testReport1 should have both CITIZEN_TOSM and EXT_TOSM chats
      const res = await request(app)
        .get(`/api/chats/report/${testReport1.id}`)
        .set("Authorization", `Bearer ${tosmToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      
      // Check if different chat types exist
      const chatTypes = res.body.map((chat: any) => chat.chatType);
      const hasMultipleTypes = new Set(chatTypes).size > 1;
      
      if (hasMultipleTypes) {
        expect(chatTypes).toContain(ChatType.EXT_TOSM);
      }
    });
  });

  describe("GET /api/chats/:chatId", () => {
    let testChatId: number;

    beforeAll(async () => {
      // Create a chat for this test suite
      const chatData = {
        secondUserId: tosmUser.id,
        reportId: testReport1.id,
      };

      const res = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(chatData);

      testChatId = res.body.id;
    });

    it("should return 200 and chat details for valid chatId", async () => {
      const res = await request(app)
        .get(`/api/chats/${testChatId}`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id", testChatId);
      expect(res.body).toHaveProperty("chatType", ChatType.CITIZEN_TOSM);
      expect(res.body.tosm_user.id).toBe(tosmUser.id);
      expect(res.body.second_user.id).toBe(citizenUser.id);
    });

    it("should return chat accessible by tosm user", async () => {
      const res = await request(app)
        .get(`/api/chats/${testChatId}`)
        .set("Authorization", `Bearer ${tosmToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testChatId);
    });

    it("should return chat with complete report information", async () => {
      const res = await request(app)
        .get(`/api/chats/${testChatId}`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.report).toHaveProperty("id");
      expect(res.body.report).toHaveProperty("title");
      expect(res.body.report).toHaveProperty("status");
      expect(res.body.report).toHaveProperty("category");
      expect(res.body.report.category).toHaveProperty("id");
    });

    it("should return 401 without authentication token", async () => {
      const res = await request(app)
        .get(`/api/chats/${testChatId}`);

      expect(res.status).toBe(401);
    });

    it("should return 400 when chatId is not a valid number", async () => {
      const res = await request(app)
        .get("/api/chats/invalid")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Chat Id of the chat you want to retrieve must be a valid number/);
    });

    it("should return 404 when chat not found", async () => {
      const res = await request(app)
        .get("/api/chats/99999")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Specified chat was not found/);
    });
  });

  describe("Chat workflow scenarios", () => {
    it("should support complete chat lifecycle: create, find, use for messaging", async () => {
      // Create a new report
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const category = (await categoryRepo.find({ take: 1 }))[0];
      
      const workflowReport = reportRepo.create({
        title: "Workflow Test Report",
        description: "Test complete workflow",
        category,
        images: ["https://example.com/test.jpg"],
        lat: 45.0703,
        long: 7.6869,
        status: ReportStatus.InProgress,
        createdBy: citizenUser,
        assignedTo: tosmUser,
      });
      const savedWorkflowReport = await reportRepo.save(workflowReport);

      // 1. Create chat
      const createRes = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({
          secondUserId: tosmUser.id,
          reportId: savedWorkflowReport.id,
        });
      expect(createRes.status).toBe(201);
      const chatId = createRes.body.id;

      // 2. Find chat in user's chat list
      const listRes = await request(app)
        .get("/api/chats")
        .set("Authorization", `Bearer ${citizenToken}`);
      expect(listRes.status).toBe(200);
      const foundInList = listRes.body.some((chat: any) => chat.id === chatId);
      expect(foundInList).toBe(true);

      // 3. Get specific chat
      const getRes = await request(app)
        .get(`/api/chats/${chatId}`)
        .set("Authorization", `Bearer ${citizenToken}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.id).toBe(chatId);

      // 4. Send message in chat
      const msgRes = await request(app)
        .post(`/api/chats/${chatId}/newMessage`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ text: "Workflow test message", receiverId: tosmUser.id });
      expect(msgRes.status).toBe(201);

      // 5. Get messages from chat
      const messagesRes = await request(app)
        .get(`/api/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${citizenToken}`);
      expect(messagesRes.status).toBe(200);
      expect(messagesRes.body.chats.length).toBeGreaterThan(0);
    });
  });
});
