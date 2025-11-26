import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { app } from '@app';
import request from 'supertest';
import { UserDAO, UserType } from '@daos/UserDAO';
import { ReportDAO, ReportStatus } from '@daos/ReportDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import { OfficeDAO } from '@daos/OfficeDAO';
import * as bcrypt from 'bcryptjs';

const createUser = async (userRepo: any, username: string, email: string, userType: UserType) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('password', salt);
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

const createReport = async (reportRepo: any, user: any, category: any) => {
  const report = reportRepo.create({
    title: 'Test Report',
    description: 'Test Description',
    status: ReportStatus.PendingApproval,
    createdBy: user,
    category,
    lat: 45.0,
    long: 7.0,
    images: ['https://example.com/image.jpg'],
  });
  return await reportRepo.save(report);
};

describe('Message routes integration tests', () => {
  let citizenToken: string;
  let techStaffToken: string;
  let citizenUser: any;
  let techStaffUser: any;
  let testReport: any;
  let testCategory: any;

  beforeAll(async () => {
    const AppDataSource = await initializeTestDatasource();
    await emptyTestData();

    const userRepo = AppDataSource.getRepository(UserDAO);
    const reportRepo = AppDataSource.getRepository(ReportDAO);
    const categoryRepo = AppDataSource.getRepository(CategoryDAO);
    const officeRepo = AppDataSource.getRepository(OfficeDAO);

    // Create office first
    const office = officeRepo.create({ name: 'Test Office' });
    await officeRepo.save(office);

    // Create category
    testCategory = categoryRepo.create({ name: 'Test Category', office });
    await categoryRepo.save(testCategory);

    citizenUser = await createUser(userRepo, 'citizen', 'citizen@test.com', UserType.CITIZEN);
    techStaffUser = await createUser(userRepo, 'techstaff', 'tech@test.com', UserType.TECHNICAL_STAFF_MEMBER);
    testReport = await createReport(reportRepo, citizenUser, testCategory);

    // Login to get tokens
    const citizenLogin = await request(app).post('/api/users/login').send({ username: 'citizen', password: 'password' });
    citizenToken = citizenLogin.body.token;

    const techLogin = await request(app).post('/api/users/login').send({ username: 'techstaff', password: 'password' });
    techStaffToken = techLogin.body.token;
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  describe('POST /api/messages', () => {
    it('should create message with citizen token and return 201', async () => {
      const newMessage = {
        text: 'Test message from citizen',
        receiverId: techStaffUser.id,
        reportId: testReport.id,
      };

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(newMessage);

      expect(res.status).toBe(201);
      expect(res.body.text).toBe('Test message from citizen');
      expect(res.body.sender.id).toBe(citizenUser.id);
    });

    it('should create message with tech staff token and return 201', async () => {
      const newMessage = {
        text: 'Test message from tech staff',
        receiverId: citizenUser.id,
        reportId: testReport.id,
      };

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${techStaffToken}`)
        .send(newMessage);

      expect(res.status).toBe(201);
      expect(res.body.text).toBe('Test message from tech staff');
      expect(res.body.sender.id).toBe(techStaffUser.id);
    });

    it('should return 401 without authentication token', async () => {
      const newMessage = {
        text: 'Unauthorized message',
        receiverId: techStaffUser.id,
        reportId: testReport.id,
      };

      const res = await request(app).post('/api/messages').send(newMessage);

      expect(res.status).toBe(401);
    });

    it('should return 400 when text is missing', async () => {
      const incompleteMessage = {
        receiverId: techStaffUser.id,
        reportId: testReport.id,
      };

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(incompleteMessage);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/text is required/);
    });

    it('should return 400 when receiverId is missing', async () => {
      const incompleteMessage = {
        text: 'Test message',
        reportId: testReport.id,
      };

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(incompleteMessage);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/receiverId is required/);
    });

    it('should return 400 when reportId is missing', async () => {
      const incompleteMessage = {
        text: 'Test message',
        receiverId: techStaffUser.id,
      };

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(incompleteMessage);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/reportId is required/);
    });
  });

  describe('GET /api/messages/report/:id', () => {
    it('should return messages for valid report ID with citizen token', async () => {
      const res = await request(app)
        .get(`/api/messages/report/${testReport.id}`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('messages');
      expect(Array.isArray(res.body.messages)).toBe(true);
    });

    it('should return messages for valid report ID with tech staff token', async () => {
      const res = await request(app)
        .get(`/api/messages/report/${testReport.id}`)
        .set('Authorization', `Bearer ${techStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('messages');
      expect(Array.isArray(res.body.messages)).toBe(true);
    });

    it('should return 401 without authentication token', async () => {
      const res = await request(app).get(`/api/messages/report/${testReport.id}`);

      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid report ID', async () => {
      const res = await request(app)
        .get('/api/messages/report/invalid')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid report ID');
    });
  });

  describe('GET /api/messages', () => {
    it('should return chats for authenticated citizen user', async () => {
      const res = await request(app)
        .get('/api/messages')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('chats');
      expect(Array.isArray(res.body.chats)).toBe(true);
    });

    it('should return chats for authenticated tech staff user', async () => {
      const res = await request(app)
        .get('/api/messages')
        .set('Authorization', `Bearer ${techStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('chats');
      expect(Array.isArray(res.body.chats)).toBe(true);
    });

    it('should return 401 without authentication token', async () => {
      const res = await request(app).get('/api/messages');

      expect(res.status).toBe(401);
    });
  });
});
