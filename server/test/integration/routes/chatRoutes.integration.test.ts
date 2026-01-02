import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { app } from '@app';
import request from 'supertest';
import { UserDAO, UserType } from '@daos/UserDAO';
import { ReportDAO, ReportStatus } from '@daos/ReportDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import { OfficeDAO } from '@daos/OfficeDAO';
import { ChatDAO, ChatType } from '@daos/ChatsDAO';
import * as bcrypt from 'bcryptjs';

// Test password constants
const TEST_PASSWORD_DEFAULT = 'password'; //NOSONAR
const TEST_PASSWORD_CITIZEN = 'citizen123'; //NOSONAR
const TEST_PASSWORD_TOSM = 'tosm123'; //NOSONAR
const TEST_PASSWORD_EXT = 'ext123'; //NOSONAR
const TEST_PASSWORD_CITIZEN2 = 'citizen456'; //NOSONAR

const NONEXISTENT_ID = 999;

const createUser = async (userRepo: any, username: string, email: string, userType: UserType, password: string = TEST_PASSWORD_DEFAULT) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const user = userRepo.create({
    username,
    email,
    passwordHash: hash,
    firstName: 'Test',
    lastName: 'User',
    userType,
    emailNotificationsEnabled: false,
  });
  return await userRepo.save(user);
};

const createReport = async (reportRepo: any, user: any, category: any, assignedTo: any) => {
  const report = reportRepo.create({
    title: 'Test Report',
    description: 'Test Description',
    status: ReportStatus.InProgress,
    createdBy: user,
    assignedTo,
    category,
    lat: 45.0,
    long: 7.0,
    images: ['https://example.com/image.jpg'],
  });
  return await reportRepo.save(report);
};

describe('Chat routes integration tests', () => {
  let citizenUser: UserDAO;
  let techStaffUser: UserDAO;
  let extMaintainerUser: UserDAO;
  let anotherCitizenUser: UserDAO;
  let testReport: ReportDAO;
  let anotherReport: ReportDAO;
  let testCategory: CategoryDAO;
  let existingChat: ChatDAO;
  let citizenToken: string;
  let techStaffToken: string;
  let extMaintainerToken: string;
  let anotherCitizenToken: string;

  beforeAll(async () => {
    const AppDataSource = await initializeTestDatasource();
    await emptyTestData();

    const userRepo = AppDataSource.getRepository(UserDAO);
    const reportRepo = AppDataSource.getRepository(ReportDAO);
    const categoryRepo = AppDataSource.getRepository(CategoryDAO);
    const officeRepo = AppDataSource.getRepository(OfficeDAO);
    const chatRepo = AppDataSource.getRepository(ChatDAO);

    // Create office and category
    const office = officeRepo.create({ name: 'Test Office' });
    await officeRepo.save(office);
    testCategory = categoryRepo.create({ name: 'Test Category', office });
    await categoryRepo.save(testCategory);

    // Create users
    citizenUser = await createUser(userRepo, 'chatcitizen', 'chatcitizen@test.com', UserType.CITIZEN, TEST_PASSWORD_CITIZEN);
    techStaffUser = await createUser(userRepo, 'chattosm', 'chattosm@test.com', UserType.TECHNICAL_STAFF_MEMBER, TEST_PASSWORD_TOSM);
    extMaintainerUser = await createUser(userRepo, 'chatext', 'chatext@test.com', UserType.EXTERNAL_MAINTAINER, TEST_PASSWORD_EXT);
    anotherCitizenUser = await createUser(userRepo, 'chatcitizen2', 'chatcitizen2@test.com', UserType.CITIZEN, TEST_PASSWORD_CITIZEN2);

    // Create reports
    testReport = await createReport(reportRepo, citizenUser, testCategory, techStaffUser);
    anotherReport = await createReport(reportRepo, anotherCitizenUser, testCategory, techStaffUser);

    // Create an existing chat
    existingChat = chatRepo.create({
      report: testReport,
      tosm_user: techStaffUser,
      second_user: citizenUser,
      chatType: ChatType.CITIZEN_TOSM,
    });
    await chatRepo.save(existingChat);

    // Get auth tokens
    const citizenLogin = await request(app)
      .post('/api/users/login')
      .send({ username: 'chatcitizen', password: TEST_PASSWORD_CITIZEN });
    citizenToken = citizenLogin.body.token;

    const tosmLogin = await request(app)
      .post('/api/users/login')
      .send({ username: 'chattosm', password: TEST_PASSWORD_TOSM });
    techStaffToken = tosmLogin.body.token;

    const extLogin = await request(app)
      .post('/api/users/login')
      .send({ username: 'chatext', password: TEST_PASSWORD_EXT });
    extMaintainerToken = extLogin.body.token;

    const anotherCitizenLogin = await request(app)
      .post('/api/users/login')
      .send({ username: 'chatcitizen2', password: TEST_PASSWORD_CITIZEN2 });
    anotherCitizenToken = anotherCitizenLogin.body.token;
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  describe('POST /api/chats', () => {
    it('should create CITIZEN_TOSM chat when citizen creates chat and return 201', async () => {
      const chatData = {
        secondUserId: techStaffUser.id,
        reportId: anotherReport.id,
      };

      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${anotherCitizenToken}`)
        .send(chatData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('chatType', ChatType.CITIZEN_TOSM);
      expect(res.body.tosm_user.id).toBe(techStaffUser.id);
      expect(res.body.second_user.id).toBe(anotherCitizenUser.id);
      expect(res.body.report.id).toBe(anotherReport.id);
    });

    it('should create EXT_TOSM chat when external maintainer creates chat and return 201', async () => {
      const chatData = {
        secondUserId: techStaffUser.id,
        reportId: testReport.id,
      };

      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${extMaintainerToken}`)
        .send(chatData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('chatType', ChatType.EXT_TOSM);
      expect(res.body.tosm_user.id).toBe(techStaffUser.id);
      expect(res.body.second_user.id).toBe(extMaintainerUser.id);
    });

    it('should create chat when tosm creates chat with citizen and return 201', async () => {
      const { AppDataSource } = await import('@database');
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const newReport = await createReport(reportRepo, citizenUser, testCategory, techStaffUser);

      const chatData = {
        secondUserId: citizenUser.id,
        reportId: newReport.id,
      };

      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${techStaffToken}`)
        .send(chatData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('chatType', ChatType.CITIZEN_TOSM);
    });

    it('should return 401 without authentication token', async () => {
      const chatData = {
        secondUserId: techStaffUser.id,
        reportId: testReport.id,
      };

      const res = await request(app)
        .post('/api/chats')
        .send(chatData);

      expect(res.status).toBe(401);
    });

    it('should return 400 when secondUserId is missing', async () => {
      const chatData = {
        reportId: testReport.id,
      };

      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(chatData);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/id of the other chat user must be specified/);
    });

    it('should return 400 when reportId is missing', async () => {
      const chatData = {
        secondUserId: techStaffUser.id,
      };

      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(chatData);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/id of the report the chat is attached to must be specified/);
    });

    it('should return 404 when tosm user not found', async () => {
      const chatData = {
        secondUserId: NONEXISTENT_ID,
        reportId: testReport.id,
      };

      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(chatData);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/TOSM specified not found/);
    });

    it('should return 404 when report not found', async () => {
      const chatData = {
        secondUserId: techStaffUser.id,
        reportId: NONEXISTENT_ID,
      };

      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(chatData);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/specified report not found/);
    });
  });

  describe('GET /api/chats', () => {
    it('should return user chats for citizen and return 200', async () => {
      const res = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].second_user.id).toBe(citizenUser.id);
    });

    it('should return user chats for tosm and return 200', async () => {
      const res = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${techStaffToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return user chats for external maintainer and return 200', async () => {
      const res = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${extMaintainerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without authentication token', async () => {
      const res = await request(app)
        .get('/api/chats')
        .set('Authorization', 'Bearer invalid');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/chats/report/:reportId', () => {
    it('should return report chats and return 200', async () => {
      const res = await request(app)
        .get(`/api/chats/report/${testReport.id}`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].report.id).toBe(testReport.id);
    });

    it('should return empty array for report with no chats', async () => {
      const { AppDataSource } = await import('@database');
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const newReport = reportRepo.create({
        title: 'No Chats Report',
        description: 'Test',
        status: ReportStatus.PendingApproval,
        createdBy: citizenUser,
        category: testCategory,
        lat: 45.0,
        long: 7.0,
        images: [],
      });
      await reportRepo.save(newReport);

      const res = await request(app)
        .get(`/api/chats/report/${newReport.id}`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return 401 without authentication token', async () => {
      const res = await request(app)
        .get(`/api/chats/report/${testReport.id}`);

      expect(res.status).toBe(401);
    });

    it('should return 400 when reportId is not a valid number', async () => {
      const res = await request(app)
        .get('/api/chats/report/invalid')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Report Id of the report the chats you want to retrieve are attached to must be a valid number/);
    });

    it('should return 404 when report not found', async () => {
      const res = await request(app)
        .get(`/api/chats/report/${NONEXISTENT_ID}`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Specified report was not found/);
    });
  });

  describe('GET /api/chats/:chatId', () => {
    it('should return chat by id and return 200', async () => {
      const res = await request(app)
        .get(`/api/chats/${existingChat.id}`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', existingChat.id);
      expect(res.body).toHaveProperty('chatType', ChatType.CITIZEN_TOSM);
      expect(res.body.tosm_user.id).toBe(techStaffUser.id);
      expect(res.body.second_user.id).toBe(citizenUser.id);
    });

    it('should return chat for tosm user and return 200', async () => {
      const res = await request(app)
        .get(`/api/chats/${existingChat.id}`)
        .set('Authorization', `Bearer ${techStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(existingChat.id);
    });

    it('should return 401 without authentication token', async () => {
      const res = await request(app)
        .get(`/api/chats/${existingChat.id}`);

      expect(res.status).toBe(401);
    });

    it('should return 400 when chatId is not a valid number', async () => {
      const res = await request(app)
        .get('/api/chats/invalid')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Chat Id of the chat you want to retrieve must be a valid number/);
    });

    it('should return 404 when chat not found', async () => {
      const res = await request(app)
        .get(`/api/chats/${NONEXISTENT_ID}`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Specified chat was not found/);
    });
  });
});
