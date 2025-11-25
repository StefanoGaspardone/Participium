import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { UserDAO, UserType } from '@daos/UserDAO';
import { ReportDAO, ReportStatus } from '@daos/ReportDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import { OfficeDAO } from '@daos/OfficeDAO';
import * as bcrypt from 'bcryptjs';

let messageController: any;

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

describe('MessageController integration tests', () => {
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

    messageController = (await import('@controllers/MessageController')).messageController;
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  describe('createMessage', () => {
    it('should create message and respond 201', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        body: {
          text: 'Test message',
          receiverId: techStaffUser.id,
          reportId: testReport.id,
        },
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const next = jest.fn();

      await messageController.createMessage(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      const message = res.json.mock.calls[0][0];
      expect(message.text).toBe('Test message');
      expect(message.sender.id).toBe(citizenUser.id);
      expect(message.receiver.id).toBe(techStaffUser.id);
    });

    it('should call next with BadRequestError when token is invalid', async () => {
      const req: any = {
        token: null,
        body: { text: 'Test', receiverId: 1, reportId: 1 },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await messageController.createMessage(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toBe('Invalid token');
    });

    it('should call next with BadRequestError when text is missing', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        body: { receiverId: techStaffUser.id, reportId: testReport.id },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await messageController.createMessage(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/text is required/);
    });

    it('should call next with BadRequestError when receiverId is missing', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        body: { text: 'Test', reportId: testReport.id },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await messageController.createMessage(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/receiverId is required/);
    });

    it('should call next with BadRequestError when reportId is missing', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        body: { text: 'Test', receiverId: techStaffUser.id },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await messageController.createMessage(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/reportId is required/);
    });
  });

  describe('getMessagesByReportId', () => {
    it('should return messages for valid report ID', async () => {
      const req: any = {
        params: { id: String(testReport.id) },
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const next = jest.fn();

      await messageController.getMessagesByReportId(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('messages');
      expect(Array.isArray(response.messages)).toBe(true);
    });

    it('should call next with BadRequestError for invalid report ID', async () => {
      const req: any = {
        params: { id: 'invalid' },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await messageController.getMessagesByReportId(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toBe('Invalid report ID');
    });
  });

  describe('getMessages', () => {
    it('should return chats for authenticated user', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const next = jest.fn();

      await messageController.getMessages(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('chats');
      expect(Array.isArray(response.chats)).toBe(true);
    });
  });
});
