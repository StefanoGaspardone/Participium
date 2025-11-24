import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { UserDAO, UserType } from '@daos/UserDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import { ReportDAO, ReportStatus } from '@daos/ReportDAO';
import { NotificationDAO } from '@daos/NotificationsDAO';
import * as bcrypt from 'bcryptjs';

let notificationController: any;

// Helper to create mock response object
const createMockResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

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

describe('NotificationController integration tests', () => {
  let citizenUser: UserDAO;
  let category: CategoryDAO;
  let report: ReportDAO;

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

    notificationController = (await import('@controllers/NotificationController')).notificationController;
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  describe('findAll', () => {
    it('should return all notifications with status 200', async () => {
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

      const req: any = {};
      const res: any = createMockResponse();
      const next = jest.fn();

      await notificationController.findAll(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('notifications');
      expect(Array.isArray(response.notifications)).toBe(true);
      expect(response.notifications.length).toBeGreaterThan(0);
    });

    it('should return empty array when no notifications exist', async () => {
      await emptyTestData();

      const req: any = {};
      const res: any = createMockResponse();
      const next = jest.fn();

      await notificationController.findAll(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.notifications).toEqual([]);
    });
  });

  describe('createNotification', () => {
    beforeEach(async () => {
      await emptyTestData();

      const { AppDataSource } = await import('@database');
      const userRepo = AppDataSource.getRepository(UserDAO);
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const reportRepo = AppDataSource.getRepository(ReportDAO);

      // Recreate test data for each test
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

    it('should create notification with valid data and return 201', async () => {
      const req: any = {
        body: {
          reportId: report.id,
          previousStatus: ReportStatus.PendingApproval,
          newStatus: ReportStatus.Assigned,
          userId: citizenUser.id,
        },
      };
      const res: any = createMockResponse();
      const next = jest.fn();

      await notificationController.createNotification(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('id');
      expect(response.previousStatus).toBe(ReportStatus.PendingApproval);
      expect(response.newStatus).toBe(ReportStatus.Assigned);
    });

    it('should call next with BadRequestError when reportId is missing', async () => {
      const req: any = {
        body: {
          previousStatus: ReportStatus.PendingApproval,
          newStatus: ReportStatus.Assigned,
          userId: citizenUser.id,
        },
      };
      const res: any = createMockResponse();
      const next = jest.fn();

      await notificationController.createNotification(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/reportId is required/);
    });

    it('should call next with BadRequestError when previousStatus is missing', async () => {
      const req: any = {
        body: {
          reportId: report.id,
          newStatus: ReportStatus.Assigned,
          userId: citizenUser.id,
        },
      };
      const res: any = createMockResponse();
      const next = jest.fn();

      await notificationController.createNotification(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/previousStatus is required/);
    });

    it('should call next with BadRequestError when newStatus is missing', async () => {
      const req: any = {
        body: {
          reportId: report.id,
          previousStatus: ReportStatus.PendingApproval,
          userId: citizenUser.id,
        },
      };
      const res: any = createMockResponse();
      const next = jest.fn();

      await notificationController.createNotification(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/newStatus is required/);
    });

    it('should call next with BadRequestError when userId is missing', async () => {
      const req: any = {
        body: {
          reportId: report.id,
          previousStatus: ReportStatus.PendingApproval,
          newStatus: ReportStatus.Assigned,
        },
      };
      const res: any = createMockResponse();
      const next = jest.fn();

      await notificationController.createNotification(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/userId is required/);
    });

    it('should call next with BadRequestError when previousStatus is invalid', async () => {
      const req: any = {
        body: {
          reportId: report.id,
          previousStatus: 'InvalidStatus',
          newStatus: ReportStatus.Assigned,
          userId: citizenUser.id,
        },
      };
      const res: any = createMockResponse();
      const next = jest.fn();

      await notificationController.createNotification(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/previous report status type is invalid/);
    });

    it('should call next with BadRequestError when newStatus is invalid', async () => {
      const req: any = {
        body: {
          reportId: report.id,
          previousStatus: ReportStatus.PendingApproval,
          newStatus: 'InvalidStatus',
          userId: citizenUser.id,
        },
      };
      const res: any = createMockResponse();
      const next = jest.fn();

      await notificationController.createNotification(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/new report status type is invalid/);
    });

    it('should call next with BadRequestError when user does not exist', async () => {
      const req: any = {
        body: {
          reportId: report.id,
          previousStatus: ReportStatus.PendingApproval,
          newStatus: ReportStatus.Assigned,
          userId: 99999,
        },
      };
      const res: any = createMockResponse();
      const next = jest.fn();

      await notificationController.createNotification(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/User not found/);
    });

    it('should call next with BadRequestError when report does not exist', async () => {
      const req: any = {
        body: {
          reportId: 99999,
          previousStatus: ReportStatus.PendingApproval,
          newStatus: ReportStatus.Assigned,
          userId: citizenUser.id,
        },
      };
      const res: any = createMockResponse();
      const next = jest.fn();

      await notificationController.createNotification(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/Report not found/);
    });
  });

  describe('updateNotificationSeen', () => {
    let notificationId: number;

    beforeEach(async () => {
      await emptyTestData();

      const { AppDataSource } = await import('@database');
      const userRepo = AppDataSource.getRepository(UserDAO);
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const notificationRepo = AppDataSource.getRepository(NotificationDAO);

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

      const notification = notificationRepo.create({
        previousStatus: ReportStatus.PendingApproval,
        newStatus: ReportStatus.Assigned,
        user: citizenUser,
        report: report,
      });
      const saved = await notificationRepo.save(notification);
      notificationId = saved.id;
    });

    it('should update notification seen status and return 200', async () => {
      const req: any = {
        params: { id: notificationId.toString() },
      };
      const res: any = createMockResponse();
      const next = jest.fn();

      await notificationController.updateNotificationSeen(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.message).toBe('Notification marked as seen');
    });

    it('should call next with BadRequestError when id is invalid', async () => {
      const req: any = {
        params: { id: 'invalid' },
      };
      const res: any = createMockResponse();
      const next = jest.fn();

      await notificationController.updateNotificationSeen(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/Invalid notification ID/);
    });

    it('should call next with BadRequestError when notification does not exist', async () => {
      const req: any = {
        params: { id: '99999' },
      };
      const res: any = createMockResponse();
      const next = jest.fn();

      await notificationController.updateNotificationSeen(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/Notification not found/);
    });
  });

  describe('getMyNotifications', () => {
    beforeEach(async () => {
      await emptyTestData();

      const { AppDataSource } = await import('@database');
      const userRepo = AppDataSource.getRepository(UserDAO);
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const notificationRepo = AppDataSource.getRepository(NotificationDAO);

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
    });

    it('should return user notifications with status 200', async () => {
      const req: any = {
        token: {
          user: { id: citizenUser.id },
        },
      };
      const res: any = createMockResponse();
      const next = jest.fn();

      await notificationController.getMyNotifications(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('notifications');
      expect(Array.isArray(response.notifications)).toBe(true);
      expect(response.notifications.length).toBe(2);
    });

    it('should call next with UnauthorizedError when token is missing', async () => {
      const req: any = {};
      const res: any = createMockResponse();
      const next = jest.fn();

      await notificationController.getMyNotifications(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.name).toBe('UnauthorizedError');
      expect(err.message).toMatch(/Token is missing/);
    });

    it('should call next with BadRequestError when user does not exist', async () => {
      const req: any = {
        token: {
          user: { id: 99999 },
        },
      };
      const res: any = createMockResponse();
      const next = jest.fn();

      await notificationController.getMyNotifications(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/User not found/);
    });

    it('should return empty array when user has no notifications', async () => {
      const { AppDataSource } = await import('@database');
      const userRepo = AppDataSource.getRepository(UserDAO);

      // Create a new user with no notifications
      const newUser = await createTestUser(userRepo, 'newuser', 'newuser');
      const savedNewUser = await userRepo.save(newUser);

      const req: any = {
        token: {
          user: { id: savedNewUser.id },
        },
      };
      const res: any = createMockResponse();
      const next = jest.fn();

      await notificationController.getMyNotifications(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.notifications).toEqual([]);
    });
  });
});
