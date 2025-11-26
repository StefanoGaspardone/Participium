import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { app } from '@app';
import request from 'supertest';
import { UserDAO, UserType } from '@daos/UserDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import { ReportDAO, ReportStatus } from '@daos/ReportDAO';
import { NotificationDAO } from '@daos/NotificationsDAO';
import * as bcrypt from 'bcryptjs';

// Helper to create test user
const createTestUser = async (userRepo: any, username: string, password: string) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return userRepo.create({
    username,
    email: `${username}@test.com`,
    passwordHash: hash,
    firstName: username.charAt(0).toUpperCase() + username.slice(1),
    lastName: 'User',
    userType: UserType.CITIZEN,
    emailNotificationsEnabled: true,
  });
};

describe('Notification routes integration tests', () => {
  let citizenUser: UserDAO;
  let category: CategoryDAO;
  let report: ReportDAO;
  let citizenToken: string;

  beforeAll(async () => {
    const AppDataSource = await initializeTestDatasource();
    await emptyTestData();

    const userRepo = AppDataSource.getRepository(UserDAO);
    const categoryRepo = AppDataSource.getRepository(CategoryDAO);
    const reportRepo = AppDataSource.getRepository(ReportDAO);

    // Create citizen user
    const citizen = await createTestUser(userRepo, 'citizen', 'citizen');
    citizenUser = await userRepo.save(citizen);

    // Create category
    const cat = categoryRepo.create({ name: 'Test Category' });
    category = await categoryRepo.save(cat);

    // Create report
    const rep = reportRepo.create({
      title: 'Test Report',
      description: 'Test Description',
      category: category,
      images: ['https://example.com/image.jpg'],
      lat: 45.0,
      long: 7.0,
      status: ReportStatus.PendingApproval,
      anonymous: false,
      createdBy: citizenUser,
    });
    report = await reportRepo.save(rep);

    // Get citizen token
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({ username: 'citizen', password: 'citizen' });
    citizenToken = loginRes.body.token;
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  describe('GET /api/notifications', () => {
    it('should return 200 and all notifications', async () => {
      // Create a notification first
      const { AppDataSource } = await import('@database');
      const notificationRepo = AppDataSource.getRepository(NotificationDAO);
      
      const notification = notificationRepo.create({
        previousStatus: ReportStatus.PendingApproval,
        newStatus: ReportStatus.Assigned,
        user: citizenUser,
        report: report,
      });
      await notificationRepo.save(notification);

      const res = await request(app).get('/api/notifications');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('notifications');
      expect(Array.isArray(res.body.notifications)).toBe(true);
      expect(res.body.notifications.length).toBeGreaterThan(0);
    });

    it('should return 200 and empty array when no notifications exist', async () => {
      await emptyTestData();

      const res = await request(app).get('/api/notifications');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('notifications');
      expect(res.body.notifications).toEqual([]);
    });
  });

  describe('POST /api/notifications', () => {
    beforeEach(async () => {
      await emptyTestData();

      const { AppDataSource } = await import('@database');
      const userRepo = AppDataSource.getRepository(UserDAO);
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const reportRepo = AppDataSource.getRepository(ReportDAO);

      const user = await createTestUser(userRepo, 'testuser', 'test');
      citizenUser = await userRepo.save(user);

      const cat = categoryRepo.create({ name: 'Category' });
      category = await categoryRepo.save(cat);

      const rep = reportRepo.create({
        title: 'Report',
        description: 'Description',
        category: category,
        images: ['https://example.com/img.jpg'],
        lat: 45.0,
        long: 7.0,
        status: ReportStatus.PendingApproval,
        anonymous: false,
        createdBy: citizenUser,
      });
      report = await reportRepo.save(rep);
    });

    it('should return 201 and create notification with valid data', async () => {
      const payload = {
        reportId: report.id,
        previousStatus: ReportStatus.PendingApproval,
        newStatus: ReportStatus.Assigned,
        userId: citizenUser.id,
      };

      const res = await request(app).post('/api/notifications').send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.previousStatus).toBe(ReportStatus.PendingApproval);
      expect(res.body.newStatus).toBe(ReportStatus.Assigned);
    });

    it('should return 400 when reportId is missing', async () => {
      const payload = {
        previousStatus: ReportStatus.PendingApproval,
        newStatus: ReportStatus.Assigned,
        userId: citizenUser.id,
      };

      const res = await request(app).post('/api/notifications').send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/reportId is required/);
    });

    it('should return 400 when previousStatus is missing', async () => {
      const payload = {
        reportId: report.id,
        newStatus: ReportStatus.Assigned,
        userId: citizenUser.id,
      };

      const res = await request(app).post('/api/notifications').send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/previousStatus is required/);
    });

    it('should return 400 when newStatus is missing', async () => {
      const payload = {
        reportId: report.id,
        previousStatus: ReportStatus.PendingApproval,
        userId: citizenUser.id,
      };

      const res = await request(app).post('/api/notifications').send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/newStatus is required/);
    });

    it('should return 400 when userId is missing', async () => {
      const payload = {
        reportId: report.id,
        previousStatus: ReportStatus.PendingApproval,
        newStatus: ReportStatus.Assigned,
      };

      const res = await request(app).post('/api/notifications').send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/userId is required/);
    });

    it('should return 400 when previousStatus is invalid', async () => {
      const payload = {
        reportId: report.id,
        previousStatus: 'InvalidStatus',
        newStatus: ReportStatus.Assigned,
        userId: citizenUser.id,
      };

      const res = await request(app).post('/api/notifications').send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/previous report status type is invalid/);
    });

    it('should return 400 when newStatus is invalid', async () => {
      const payload = {
        reportId: report.id,
        previousStatus: ReportStatus.PendingApproval,
        newStatus: 'InvalidStatus',
        userId: citizenUser.id,
      };

      const res = await request(app).post('/api/notifications').send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/new report status type is invalid/);
    });

    it('should return 400 when user does not exist', async () => {
      const payload = {
        reportId: report.id,
        previousStatus: ReportStatus.PendingApproval,
        newStatus: ReportStatus.Assigned,
        userId: 99999,
      };

      const res = await request(app).post('/api/notifications').send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/User not found/);
    });

    it('should return 400 when report does not exist', async () => {
      const payload = {
        reportId: 99999,
        previousStatus: ReportStatus.PendingApproval,
        newStatus: ReportStatus.Assigned,
        userId: citizenUser.id,
      };

      const res = await request(app).post('/api/notifications').send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/Report not found/);
    });
  });

  describe('PATCH /api/notifications/seen/:id', () => {
    let notificationId: number;

    beforeEach(async () => {
      await emptyTestData();

      const { AppDataSource } = await import('@database');
      const userRepo = AppDataSource.getRepository(UserDAO);
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const notificationRepo = AppDataSource.getRepository(NotificationDAO);

      const user = await createTestUser(userRepo, 'citizen', 'citizen');
      citizenUser = await userRepo.save(user);

      const cat = categoryRepo.create({ name: 'Category' });
      category = await categoryRepo.save(cat);

      const rep = reportRepo.create({
        title: 'Report',
        description: 'Description',
        category: category,
        images: ['https://example.com/img.jpg'],
        lat: 45.0,
        long: 7.0,
        status: ReportStatus.PendingApproval,
        anonymous: false,
        createdBy: citizenUser,
      });
      report = await reportRepo.save(rep);

      const notification = notificationRepo.create({
        previousStatus: ReportStatus.PendingApproval,
        newStatus: ReportStatus.Assigned,
        user: citizenUser,
        report: report,
      });
      const saved = await notificationRepo.save(notification);
      notificationId = saved.id;

      // Get citizen token
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({ username: 'citizen', password: 'citizen' });
      citizenToken = loginRes.body.token;
    });

    it('should return 200 and mark notification as seen', async () => {
      const res = await request(app)
        .patch(`/api/notifications/seen/${notificationId}`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toBe('Notification marked as seen');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).patch(`/api/notifications/seen/${notificationId}`);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 when notification id is invalid', async () => {
      const res = await request(app)
        .patch('/api/notifications/seen/invalid')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/Invalid notification ID/);
    });

    it('should return 400 when notification does not exist', async () => {
      const res = await request(app)
        .patch('/api/notifications/seen/99999')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/Notification not found/);
    });
  });

  describe('GET /api/notifications/my', () => {
    beforeEach(async () => {
      await emptyTestData();

      const { AppDataSource } = await import('@database');
      const userRepo = AppDataSource.getRepository(UserDAO);
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const notificationRepo = AppDataSource.getRepository(NotificationDAO);

      const user = await createTestUser(userRepo, 'citizen', 'citizen');
      citizenUser = await userRepo.save(user);

      const cat = categoryRepo.create({ name: 'Category' });
      category = await categoryRepo.save(cat);

      const rep = reportRepo.create({
        title: 'Report',
        description: 'Description',
        category: category,
        images: ['https://example.com/img.jpg'],
        lat: 45.0,
        long: 7.0,
        status: ReportStatus.PendingApproval,
        anonymous: false,
        createdBy: citizenUser,
      });
      report = await reportRepo.save(rep);

      // Create notifications for this user
      const notification1 = notificationRepo.create({
        previousStatus: ReportStatus.PendingApproval,
        newStatus: ReportStatus.Assigned,
        user: citizenUser,
        report: report,
      });
      await notificationRepo.save(notification1);

      const notification2 = notificationRepo.create({
        previousStatus: ReportStatus.Assigned,
        newStatus: ReportStatus.InProgress,
        user: citizenUser,
        report: report,
      });
      await notificationRepo.save(notification2);

      // Get citizen token
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({ username: 'citizen', password: 'citizen' });
      citizenToken = loginRes.body.token;
    });

    it('should return 200 and user notifications', async () => {
      const res = await request(app)
        .get('/api/notifications/my')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('notifications');
      expect(Array.isArray(res.body.notifications)).toBe(true);
      expect(res.body.notifications.length).toBe(2);
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/notifications/my');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 200 and empty array when user has no notifications', async () => {
      // Create a new user with no notifications
      const { AppDataSource } = await import('@database');
      const userRepo = AppDataSource.getRepository(UserDAO);

      const newUser = await createTestUser(userRepo, 'newuser', 'newuser');
      await userRepo.save(newUser);

      // Login as new user
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({ username: 'newuser', password: 'newuser' });
      const newUserToken = loginRes.body.token;

      const res = await request(app)
        .get('/api/notifications/my')
        .set('Authorization', `Bearer ${newUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('notifications');
      expect(res.body.notifications).toEqual([]);
    });
  });
});
