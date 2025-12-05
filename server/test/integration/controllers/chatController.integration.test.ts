import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { UserDAO, UserType } from '@daos/UserDAO';
import { ReportDAO, ReportStatus } from '@daos/ReportDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import { OfficeDAO } from '@daos/OfficeDAO';
import { ChatDAO, ChatType } from '@daos/ChatsDAO';
import * as bcrypt from 'bcryptjs';

let chatController: any;

const NONEXISTENT_ID = 999;

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

describe('ChatController integration tests', () => {
  let citizenUser: UserDAO;
  let techStaffUser: UserDAO;
  let extMaintainerUser: UserDAO;
  let anotherCitizenUser: UserDAO;
  let testReport: ReportDAO;
  let anotherReport: ReportDAO;
  let testCategory: CategoryDAO;
  let existingChat: ChatDAO;

  beforeAll(async () => {
    const AppDataSource = await initializeTestDatasource();
    await emptyTestData();

    const userRepo = AppDataSource.getRepository(UserDAO);
    const reportRepo = AppDataSource.getRepository(ReportDAO);
    const categoryRepo = AppDataSource.getRepository(CategoryDAO);
    const officeRepo = AppDataSource.getRepository(OfficeDAO);
    const chatRepo = AppDataSource.getRepository(ChatDAO);

    // Create office first
    const office = officeRepo.create({ name: 'Test Office' });
    await officeRepo.save(office);

    // Create category
    testCategory = categoryRepo.create({ name: 'Test Category', office });
    await categoryRepo.save(testCategory);

    // Create users
    citizenUser = await createUser(userRepo, 'citizen', 'citizen@test.com', UserType.CITIZEN);
    techStaffUser = await createUser(userRepo, 'techstaff', 'tech@test.com', UserType.TECHNICAL_STAFF_MEMBER);
    extMaintainerUser = await createUser(userRepo, 'extmaintainer', 'ext@test.com', UserType.EXTERNAL_MAINTAINER);
    anotherCitizenUser = await createUser(userRepo, 'citizen2', 'citizen2@test.com', UserType.CITIZEN);

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

    chatController = (await import('@controllers/ChatController')).chatController;
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  describe('createChat', () => {
    it('should create CITIZEN_TOSM chat when citizen creates chat and respond 201', async () => {
      const req: any = {
        token: { user: { id: anotherCitizenUser.id, userType: UserType.CITIZEN } },
        body: {
          secondUserId: techStaffUser.id,
          reportId: anotherReport.id,
        },
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const next = jest.fn();

      await chatController.createChat(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      const chat = res.json.mock.calls[0][0];
      expect(chat.chatType).toBe(ChatType.CITIZEN_TOSM);
      expect(chat.tosm_user.id).toBe(techStaffUser.id);
      expect(chat.second_user.id).toBe(anotherCitizenUser.id);
      expect(chat.report.id).toBe(anotherReport.id);
    });

    it('should create EXT_TOSM chat when external maintainer creates chat and respond 201', async () => {
      const req: any = {
        token: { user: { id: extMaintainerUser.id, userType: UserType.EXTERNAL_MAINTAINER } },
        body: {
          secondUserId: techStaffUser.id,
          reportId: testReport.id,
        },
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const next = jest.fn();

      await chatController.createChat(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      const chat = res.json.mock.calls[0][0];
      expect(chat.chatType).toBe(ChatType.EXT_TOSM);
      expect(chat.tosm_user.id).toBe(techStaffUser.id);
      expect(chat.second_user.id).toBe(extMaintainerUser.id);
      expect(chat.report.id).toBe(testReport.id);
    });

    it('should create CITIZEN_TOSM chat when tosm creates chat with citizen and respond 201', async () => {
      const AppDataSource = await import('@database');
      const reportRepo = AppDataSource.AppDataSource.getRepository(ReportDAO);
      const newReport = await createReport(reportRepo, citizenUser, testCategory, techStaffUser);

      const req: any = {
        token: { user: { id: techStaffUser.id, userType: UserType.TECHNICAL_STAFF_MEMBER } },
        body: {
          secondUserId: citizenUser.id,
          reportId: newReport.id,
        },
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const next = jest.fn();

      await chatController.createChat(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      const chat = res.json.mock.calls[0][0];
      expect(chat.chatType).toBe(ChatType.CITIZEN_TOSM);
    });

    it('should call next with BadRequestError when token is invalid', async () => {
      const req: any = {
        token: null,
        body: {
          secondUserId: techStaffUser.id,
          reportId: testReport.id,
        },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await chatController.createChat(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toBe('Invalid token');
    });

    it('should call next with BadRequestError when secondUserId is missing', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id, userType: UserType.CITIZEN } },
        body: {
          reportId: testReport.id,
        },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await chatController.createChat(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/id of the other chat user must be specified/);
    });

    it('should call next with BadRequestError when reportId is missing', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id, userType: UserType.CITIZEN } },
        body: {
          secondUserId: techStaffUser.id,
        },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await chatController.createChat(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/id of the report the chat is attached to must be specified/);
    });

    it('should call next with NotFoundError when tosm user not found', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id, userType: UserType.CITIZEN } },
        body: {
          secondUserId: NONEXISTENT_ID,
          reportId: testReport.id,
        },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await chatController.createChat(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('NotFoundError');
      expect(err.message).toMatch(/TOSM specified not found/);
    });

    it('should call next with NotFoundError when report not found', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id, userType: UserType.CITIZEN } },
        body: {
          secondUserId: techStaffUser.id,
          reportId: NONEXISTENT_ID,
        },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await chatController.createChat(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('NotFoundError');
      expect(err.message).toMatch(/specified report not found/);
    });
  });

  describe('findUserChats', () => {
    it('should return user chats and respond 200', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const next = jest.fn();

      await chatController.findUserChats(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const chats = res.json.mock.calls[0][0];
      expect(Array.isArray(chats)).toBe(true);
      expect(chats.length).toBeGreaterThan(0);
      expect(chats[0].second_user.id).toBe(citizenUser.id);
    });

    it('should return empty array when user has no chats', async () => {
      const AppDataSource = await import('@database');
      const userRepo = AppDataSource.AppDataSource.getRepository(UserDAO);
      const newUser = await createUser(userRepo, 'nochats', 'nochats@test.com', UserType.CITIZEN);

      const req: any = {
        token: { user: { id: newUser.id } },
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const next = jest.fn();

      await chatController.findUserChats(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      const chats = res.json.mock.calls[0][0];
      expect(chats).toEqual([]);
    });

    it('should call next with BadRequestError when token is invalid', async () => {
      const req: any = {
        token: null,
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await chatController.findUserChats(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toBe('Invalid token');
    });

    it('should call next with NotFoundError when user not found', async () => {
      const req: any = {
        token: { user: { id: NONEXISTENT_ID } },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await chatController.findUserChats(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('NotFoundError');
      expect(err.message).toMatch(/specified user not found/);
    });
  });

  describe('findReportChats', () => {
    it('should return report chats and respond 200', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        params: { reportId: String(testReport.id) },
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const next = jest.fn();

      await chatController.findReportChats(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const chats = res.json.mock.calls[0][0];
      expect(Array.isArray(chats)).toBe(true);
      expect(chats.length).toBeGreaterThan(0);
      expect(chats[0].report.id).toBe(testReport.id);
    });

    it('should return empty array when report has no chats', async () => {
      const AppDataSource = await import('@database');
      const reportRepo = AppDataSource.AppDataSource.getRepository(ReportDAO);
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

      const req: any = {
        token: { user: { id: citizenUser.id } },
        params: { reportId: String(newReport.id) },
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const next = jest.fn();

      await chatController.findReportChats(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      const chats = res.json.mock.calls[0][0];
      expect(chats).toEqual([]);
    });

    it('should call next with BadRequestError when token is invalid', async () => {
      const req: any = {
        token: null,
        params: { reportId: String(testReport.id) },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await chatController.findReportChats(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toBe('Invalid token');
    });

    it('should call next with BadRequestError when reportId is missing', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        params: {},
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await chatController.findReportChats(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/Report Id of the report the chats you want to retrieve are attached to must be specified/);
    });

    it('should call next with BadRequestError when reportId is not a valid number', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        params: { reportId: 'invalid' },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await chatController.findReportChats(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/Report Id of the report the chats you want to retrieve are attached to must be a valid number/);
    });

    it('should call next with NotFoundError when report not found', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        params: { reportId: String(NONEXISTENT_ID) },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await chatController.findReportChats(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('NotFoundError');
      expect(err.message).toMatch(/Specified report was not found/);
    });
  });

  describe('findChat', () => {
    it('should return chat by id and respond 200', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        params: { chatId: String(existingChat.id) },
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const next = jest.fn();

      await chatController.findChat(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const chat = res.json.mock.calls[0][0];
      expect(chat).toBeDefined();
      expect(chat.id).toBe(existingChat.id);
      expect(chat.chatType).toBe(ChatType.CITIZEN_TOSM);
    });

    it('should call next with BadRequestError when token is invalid', async () => {
      const req: any = {
        token: null,
        params: { chatId: String(existingChat.id) },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await chatController.findChat(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toBe('Invalid token');
    });

    it('should call next with BadRequestError when chatId is missing', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        params: {},
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await chatController.findChat(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/Chat Id of the chat you want to retrieve must be specified/);
    });

    it('should call next with BadRequestError when chatId is not a valid number', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        params: { chatId: 'invalid' },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await chatController.findChat(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/Chat Id of the chat you want to retrieve must be a valid number/);
    });

    it('should call next with NotFoundError when chat not found', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        params: { chatId: String(NONEXISTENT_ID) },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await chatController.findChat(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('NotFoundError');
      expect(err.message).toMatch(/Specified chat was not found/);
    });
  });
});
