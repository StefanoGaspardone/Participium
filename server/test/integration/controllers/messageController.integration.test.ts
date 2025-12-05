import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { UserDAO, UserType } from '@daos/UserDAO';
import { ReportDAO, ReportStatus } from '@daos/ReportDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import { OfficeDAO } from '@daos/OfficeDAO';
import { ChatDAO, ChatType } from '@daos/ChatsDAO';
import * as bcrypt from 'bcryptjs';

let messageController: any;

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
  let citizenUser: UserDAO;
  let techStaffUser: UserDAO;
  let extMaintainerUser: UserDAO;
  let testReport: ReportDAO;
  let testCategory: CategoryDAO;
  let citizenTosmChat: ChatDAO;
  let extTosmChat: ChatDAO;

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
    
    testReport = await createReport(reportRepo, citizenUser, testCategory);

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

    messageController = (await import('@controllers/MessageController')).messageController;
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  describe('createMessage', () => {
    it('should create message from citizen to tosm and respond 201', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        params: { chatId: String(citizenTosmChat.id) },
        body: {
          text: 'Hello from citizen',
          receiverId: techStaffUser.id,
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
      expect(message).toHaveProperty('id');
      expect(message.text).toBe('Hello from citizen');
      expect(message.sender).toBe(citizenUser.id);
      expect(message.receiver).toBe(techStaffUser.id);
      expect(message.chat).toBe(citizenTosmChat.id);
    });

    it('should create message from tosm to external maintainer and respond 201', async () => {
      const req: any = {
        token: { user: { id: techStaffUser.id } },
        params: { chatId: String(extTosmChat.id) },
        body: {
          text: 'Hello from tosm',
          receiverId: extMaintainerUser.id,
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
      expect(message).toHaveProperty('id');
      expect(message.text).toBe('Hello from tosm');
      expect(message.sender).toBe(techStaffUser.id);
      expect(message.receiver).toBe(extMaintainerUser.id);
      expect(message.chat).toBe(extTosmChat.id);
    });

    it('should call next with BadRequestError when token is invalid', async () => {
      const req: any = {
        token: null,
        params: { chatId: String(citizenTosmChat.id) },
        body: { text: 'Test', receiverId: techStaffUser.id },
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
        params: { chatId: String(citizenTosmChat.id) },
        body: { receiverId: techStaffUser.id },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await messageController.createMessage(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/text is required/);
    });

    it('should call next with BadRequestError when text is not a string', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        params: { chatId: String(citizenTosmChat.id) },
        body: { text: 123, receiverId: techStaffUser.id },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await messageController.createMessage(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/text is required and it must be a string/);
    });

    it('should call next with BadRequestError when receiverId is missing', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        params: { chatId: String(citizenTosmChat.id) },
        body: { text: 'Test message' },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await messageController.createMessage(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/receiverId is required/);
    });

    it('should call next with BadRequestError when receiverId is not a number', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        params: { chatId: String(citizenTosmChat.id) },
        body: { text: 'Test message', receiverId: 'invalid' },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await messageController.createMessage(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/receiverId is required and it must be a number/);
    });

    it('should call next with BadRequestError when chatId is missing', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        params: {},
        body: { text: 'Test', receiverId: techStaffUser.id },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await messageController.createMessage(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/chatId must be specified/);
    });

    it('should call next with BadRequestError when chatId is not a valid number', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        params: { chatId: 'invalid' },
        body: { text: 'Test', receiverId: techStaffUser.id },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await messageController.createMessage(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/chatId must be a number/);
    });

    it('should call next with NotFoundError when chat does not exist', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        params: { chatId: String(NONEXISTENT_ID) },
        body: { text: 'Test', receiverId: techStaffUser.id },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await messageController.createMessage(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('NotFoundError');
      expect(err.message).toMatch(/Chat not found/);
    });

    it('should call next with NotFoundError when sender is not in chat', async () => {
      const req: any = {
        token: { user: { id: extMaintainerUser.id } },
        params: { chatId: String(citizenTosmChat.id) },
        body: { text: 'Test', receiverId: techStaffUser.id },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await messageController.createMessage(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/sender inserted is not part of the chat/);
    });

    it('should call next with NotFoundError when receiver is not in chat', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        params: { chatId: String(citizenTosmChat.id) },
        body: { text: 'Test', receiverId: extMaintainerUser.id },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await messageController.createMessage(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/receiver is not part of the chat/);
    });
  });

  describe('getChatMessages', () => {
    it('should return messages for a valid chat', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        params: { chatId: String(citizenTosmChat.id) },
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const next = jest.fn();

      await messageController.getChatMessages(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const result = res.json.mock.calls[0][0];
      expect(result).toHaveProperty('chats');
      expect(Array.isArray(result.chats)).toBe(true);
    });

    it('should return messages array for chat (may be empty or contain messages from other tests)', async () => {
      const req: any = {
        token: { user: { id: techStaffUser.id } },
        params: { chatId: String(extTosmChat.id) },
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const next = jest.fn();

      await messageController.getChatMessages(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const result = res.json.mock.calls[0][0];
      expect(result).toHaveProperty('chats');
      expect(Array.isArray(result.chats)).toBe(true);
    });

    it('should call next with BadRequestError when token is invalid', async () => {
      const req: any = {
        token: null,
        params: { chatId: String(citizenTosmChat.id) },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await messageController.getChatMessages(req, res, next);

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

      await messageController.getChatMessages(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/chat id of the chat desired to retrieve must be specified/);
    });

    it('should call next with BadRequestError when chatId is not a valid number', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        params: { chatId: 'invalid' },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await messageController.getChatMessages(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toMatch(/The chat id must be a valid number/);
    });

    it('should call next with NotFoundError when chat does not exist', async () => {
      const req: any = {
        token: { user: { id: citizenUser.id } },
        params: { chatId: String(NONEXISTENT_ID) },
      };

      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await messageController.getChatMessages(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('NotFoundError');
      expect(err.message).toMatch(/Chat not found/);
    });
  });
});
