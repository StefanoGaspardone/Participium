import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { app } from '@app';
import request from 'supertest';
import { UserDAO, UserType } from '@daos/UserDAO';
import { ReportDAO, ReportStatus } from '@daos/ReportDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import { OfficeDAO } from '@daos/OfficeDAO';
import { ChatDAO, ChatType } from '@daos/ChatsDAO';
import * as bcrypt from 'bcryptjs';

// Tests for chat-based message routes:
// - POST /api/chats/:chatId/newMessage
// - GET /api/chats/:chatId/messages

const NONEXISTENT_ID = 999;

const createUser = async (userRepo: any, username: string, email: string, userType: UserType, password: string = 'password') => {
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

describe('Message routes integration tests', () => {
  let citizenUser: UserDAO;
  let techStaffUser: UserDAO;
  let extMaintainerUser: UserDAO;
  let testReport: ReportDAO;
  let testCategory: CategoryDAO;
  let citizenTosmChat: ChatDAO;
  let extTosmChat: ChatDAO;
  let citizenToken: string;
  let techStaffToken: string;
  let extMaintainerToken: string;
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
    citizenUser = await createUser(userRepo, 'routecitizen', 'routecitizen@test.com', UserType.CITIZEN, 'citizen123');
    techStaffUser = await createUser(userRepo, 'routetosm', 'routetosm@test.com', UserType.TECHNICAL_STAFF_MEMBER, 'tosm123');
    extMaintainerUser = await createUser(userRepo, 'routeext', 'routeext@test.com', UserType.EXTERNAL_MAINTAINER, 'ext123');

    // Create report
    testReport = await createReport(reportRepo, citizenUser, testCategory, techStaffUser);

    // Create chats
    citizenTosmChat = chatRepo.create({
      report: testReport,
      tosm_user: techStaffUser,
      second_user: citizenUser,
      chatType: ChatType.CITIZEN_TOSM,
    });
    await chatRepo.save(citizenTosmChat);

    extTosmChat = chatRepo.create({
      report: testReport,
      tosm_user: techStaffUser,
      second_user: extMaintainerUser,
      chatType: ChatType.EXT_TOSM,
    });
    await chatRepo.save(extTosmChat);

    // Get auth tokens
    const citizenLogin = await request(app)
      .post('/api/users/login')
      .send({ username: 'routecitizen', password: 'citizen123' });
    citizenToken = citizenLogin.body.token;

    const tosmLogin = await request(app)
      .post('/api/users/login')
      .send({ username: 'routetosm', password: 'tosm123' });
    techStaffToken = tosmLogin.body.token;

    const extLogin = await request(app)
      .post('/api/users/login')
      .send({ username: 'routeext', password: 'ext123' });
    extMaintainerToken = extLogin.body.token;
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  describe('POST /api/chats/:chatId/newMessage', () => {
    it('should create message and return 201 with valid data', async () => {
      const newMessage = {
        text: 'Hello from citizen',
        receiverId: techStaffUser.id,
      };

      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(newMessage);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('text', 'Hello from citizen');
      expect(res.body).toHaveProperty('sender', citizenUser.id);
      expect(res.body).toHaveProperty('receiver', techStaffUser.id);
      expect(res.body).toHaveProperty('chat', citizenTosmChat.id);
    });

    it('should create message from tosm to external maintainer and return 201', async () => {
      const newMessage = {
        text: 'Hello from tosm',
        receiverId: extMaintainerUser.id,
      };

      const res = await request(app)
        .post(`/api/chats/${extTosmChat.id}/newMessage`)
        .set('Authorization', `Bearer ${techStaffToken}`)
        .send(newMessage);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('text', 'Hello from tosm');
      expect(res.body).toHaveProperty('sender', techStaffUser.id);
      expect(res.body).toHaveProperty('receiver', extMaintainerUser.id);
    });

    it('should return 401 without authentication token', async () => {
      const newMessage = {
        text: 'Unauthorized message',
        receiverId: techStaffUser.id,
      };

      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .send(newMessage);

      expect(res.status).toBe(401);
    });

    it('should return 400 when text is missing', async () => {
      const incompleteMessage = {
        receiverId: techStaffUser.id,
      };

      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(incompleteMessage);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/text is required/);
    });

    it('should return 400 when text is not a string', async () => {
      const invalidMessage = {
        text: 123,
        receiverId: techStaffUser.id,
      };

      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(invalidMessage);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/text is required and it must be a string/);
    });

    it('should return 400 when receiverId is missing', async () => {
      const incompleteMessage = {
        text: 'Test message',
      };

      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(incompleteMessage);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/receiverId is required/);
    });

    it('should return 400 when receiverId is not a number', async () => {
      const invalidMessage = {
        text: 'Test message',
        receiverId: 'invalid',
      };

      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(invalidMessage);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/receiverId is required and it must be a number/);
    });

    it('should return 400 when chatId is not a valid number', async () => {
      const newMessage = {
        text: 'Test message',
        receiverId: techStaffUser.id,
      };

      const res = await request(app)
        .post('/api/chats/invalid/newMessage')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(newMessage);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/chatId must be a number/);
    });

    it('should return 404 when chat does not exist', async () => {
      const newMessage = {
        text: 'Test message',
        receiverId: techStaffUser.id,
      };

      const res = await request(app)
        .post(`/api/chats/${NONEXISTENT_ID}/newMessage`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(newMessage);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Chat not found/);
    });

    it('should return 400 when sender is not part of the chat', async () => {
      const newMessage = {
        text: 'Test message',
        receiverId: techStaffUser.id,
      };

      const res = await request(app)
        .post(`/api/chats/${extTosmChat.id}/newMessage`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(newMessage);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/sender inserted is not part of the chat/);
    });

    it('should return 400 when receiver is not part of the chat', async () => {
      const newMessage = {
        text: 'Test message',
        receiverId: extMaintainerUser.id,
      };

      const res = await request(app)
        .post(`/api/chats/${citizenTosmChat.id}/newMessage`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(newMessage);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/receiver is not part of the chat/);
    });
  });

  describe('GET /api/chats/:chatId/messages', () => {
    it('should return messages for valid chatId with citizen token', async () => {
      const res = await request(app)
        .get(`/api/chats/${citizenTosmChat.id}/messages`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('chats');
      expect(Array.isArray(res.body.chats)).toBe(true);
    });

    it('should return messages for valid chatId with tosm token', async () => {
      const res = await request(app)
        .get(`/api/chats/${citizenTosmChat.id}/messages`)
        .set('Authorization', `Bearer ${techStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('chats');
      expect(Array.isArray(res.body.chats)).toBe(true);
    });

    it('should return messages for ext-tosm chat with ext maintainer token', async () => {
      const res = await request(app)
        .get(`/api/chats/${extTosmChat.id}/messages`)
        .set('Authorization', `Bearer ${extMaintainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('chats');
      expect(Array.isArray(res.body.chats)).toBe(true);
    });

    it('should return 401 without authentication token', async () => {
      const res = await request(app)
        .get(`/api/chats/${citizenTosmChat.id}/messages`);

      expect(res.status).toBe(401);
    });

    it('should return 400 when chatId is not a valid number', async () => {
      const res = await request(app)
        .get('/api/chats/invalid/messages')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/The chat id must be a valid number/);
    });

    it('should return 404 when chat does not exist', async () => {
      const res = await request(app)
        .get(`/api/chats/${NONEXISTENT_ID}/messages`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Chat not found/);
    });
  });
});
