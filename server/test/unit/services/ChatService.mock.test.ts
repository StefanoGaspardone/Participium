import { ChatService } from '@services/ChatService';
import { createChatDTO } from '@dtos/ChatDTO';
import { ChatDAO, ChatType } from '@daos/ChatsDAO';
import { UserDAO, UserType } from '@daos/UserDAO';
import { ReportDAO } from '@daos/ReportDAO';

describe('ChatService (mock)', () => {
  const MOCK_TOSM_ID = 1;
  const MOCK_USER_ID = 2;
  const MOCK_REPORT_ID = 1;
  const MOCK_CHAT_ID = 10;
  const NONEXISTENT_ID = 999;

  const createUser = (id: number, username: string, userType: UserType): UserDAO => 
    ({
      id,
      username,
      firstName: 'First',
      lastName: 'Last',
      userType,
      email: `${username}@test.com`,
      isActive: true,
      emailNotificationsEnabled: false,
      passwordHash: 'hash'
    } as UserDAO);

  const createReport = (id: number): ReportDAO => ({
    id,
    title: 'Test Report',
    category: { id: 1, name: 'Category' },
    createdBy: createUser(1, 'creator', UserType.CITIZEN),
    assignedTo: createUser(2, 'tosm', UserType.TECHNICAL_STAFF_MEMBER)
  } as ReportDAO);

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('createChat', () => {
    it('should throw NotFoundError when tosm_user does not exist', async () => {
      const service = new ChatService();

      // @ts-ignore
      service['userRepository'] = {
        findUserById: jest.fn().mockResolvedValue(null)
      };

      const createChatDTO: createChatDTO = {
        tosm_user_id: MOCK_TOSM_ID,
        second_user_id: MOCK_USER_ID,
        report_id: MOCK_REPORT_ID
      };

      await expect(service.createChat(createChatDTO)).rejects.toThrow('TOSM specified not found');
    });

    it('should throw NotFoundError when second_user does not exist', async () => {
      const service = new ChatService();
      const tosm = createUser(1, 'tosm', UserType.TECHNICAL_STAFF_MEMBER);

      // @ts-ignore
      service['userRepository'] = {
        findUserById: jest.fn()
          .mockResolvedValueOnce(tosm)
          .mockResolvedValueOnce(null)
      };

      await expect(service.createChat({
        tosm_user_id: 1,
        second_user_id: 999,
        report_id: 1
      })).rejects.toThrow('specified user not found');
    });

    it('should throw NotFoundError when report does not exist', async () => {
      const service = new ChatService();
      const tosm = createUser(1, 'tosm', UserType.TECHNICAL_STAFF_MEMBER);
      const citizen = createUser(2, 'citizen', UserType.CITIZEN);

      // @ts-ignore
      service['userRepository'] = {
        findUserById: jest.fn()
          .mockResolvedValueOnce(tosm)
          .mockResolvedValueOnce(citizen)
      };

      // @ts-ignore
      service['reportRepository'] = {
        findReportById: jest.fn().mockResolvedValue(null)
      };

      await expect(service.createChat({
        tosm_user_id: 1,
        second_user_id: 2,
        report_id: 999
      })).rejects.toThrow('specified report not found');
    });

    test.each([
      ['CITIZEN_TOSM', UserType.CITIZEN, ChatType.CITIZEN_TOSM],
      ['EXT_TOSM', UserType.EXTERNAL_MAINTAINER, ChatType.EXT_TOSM]
    ])('should create %s chat type for %s user', async (_, userType, expectedChatType) => {
      const service = new ChatService();
      const tosm = createUser(MOCK_TOSM_ID, 'tosm', UserType.TECHNICAL_STAFF_MEMBER);
      const secondUser = createUser(MOCK_USER_ID, 'user', userType);
      const report = createReport(MOCK_REPORT_ID);

      const savedChat = {
        id: MOCK_CHAT_ID,
        tosm_user: tosm,
        second_user: secondUser,
        report,
        chatType: expectedChatType
      } as ChatDAO;

      const createMock = jest.fn().mockResolvedValue(savedChat);

      // @ts-ignore
      service['userRepository'] = {
        findUserById: jest.fn()
          .mockResolvedValueOnce(tosm)
          .mockResolvedValueOnce(secondUser)
      };

      // @ts-ignore
      service['reportRepository'] = {
        findReportById: jest.fn().mockResolvedValue(report)
      };

      // @ts-ignore
      service['chatRepository'] = {
        create: createMock
      };

      const result = await service.createChat({
        tosm_user_id: MOCK_TOSM_ID,
        second_user_id: MOCK_USER_ID,
        report_id: MOCK_REPORT_ID
      });

      expect(createMock).toHaveBeenCalledTimes(1);
      const passedChat = createMock.mock.calls[0][0] as ChatDAO;
      expect(passedChat.chatType).toBe(expectedChatType);
      expect(passedChat.tosm_user).toEqual(tosm);
      expect(passedChat.second_user).toEqual(secondUser);
      expect(passedChat.report).toEqual(report);
      expect(result.id).toBe(MOCK_CHAT_ID);
    });

    it('should throw error when chatType cannot be recognized', async () => {
      const service = new ChatService();
      const tosm = createUser(1, 'tosm', UserType.TECHNICAL_STAFF_MEMBER);
      const admin = createUser(2, 'admin', UserType.ADMINISTRATOR);
      const report = createReport(1);

      // @ts-ignore
      service['userRepository'] = {
        findUserById: jest.fn()
          .mockResolvedValueOnce(tosm)
          .mockResolvedValueOnce(admin)
      };

      // @ts-ignore
      service['reportRepository'] = {
        findReportById: jest.fn().mockResolvedValue(report)
      };

      await expect(service.createChat({
        tosm_user_id: 1,
        second_user_id: 2,
        report_id: 1
      })).rejects.toThrow('chatType could not be recognized');
    });
  });

  describe('findAllByUserId', () => {
    it('should throw NotFoundError when user does not exist', async () => {
      const service = new ChatService();

      // @ts-ignore
      service['userRepository'] = {
        findUserById: jest.fn().mockResolvedValue(null)
      };

      await expect(service.findAllByUserId(NONEXISTENT_ID)).rejects.toThrow('specified user not found');
    });

    it('should return empty array when user has no chats', async () => {
      const service = new ChatService();
      const user = createUser(1, 'user', UserType.CITIZEN);

      // @ts-ignore
      service['userRepository'] = {
        findUserById: jest.fn().mockResolvedValue(user)
      };

      // @ts-ignore
      service['chatRepository'] = {
        findAllByUserId: jest.fn().mockResolvedValue([])
      };

      const result = await service.findAllByUserId(1);

      expect(result).toHaveLength(0);
    });

    it('should return list of chats for a user', async () => {
      const service = new ChatService();
      const user = createUser(1, 'user', UserType.CITIZEN);
      const tosm = createUser(2, 'tosm', UserType.TECHNICAL_STAFF_MEMBER);
      const report = createReport(1);

      const chats: ChatDAO[] = [
        {
          id: 1,
          tosm_user: tosm,
          second_user: user,
          report,
          chatType: ChatType.CITIZEN_TOSM
        } as ChatDAO
      ];

      // @ts-ignore
      service['userRepository'] = {
        findUserById: jest.fn().mockResolvedValue(user)
      };

      // @ts-ignore
      service['chatRepository'] = {
        findAllByUserId: jest.fn().mockResolvedValue(chats)
      };

      const result = await service.findAllByUserId(1);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].chatType).toBe(ChatType.CITIZEN_TOSM);
    });
  });

  describe('findByReportId', () => {
    it('should throw NotFoundError when report does not exist', async () => {
      const service = new ChatService();

      // @ts-ignore
      service['reportRepository'] = {
        findReportById: jest.fn().mockResolvedValue(null)
      };

      await expect(service.findByReportId(NONEXISTENT_ID)).rejects.toThrow('Specified report was not found');
    });

    it('should return empty array when no chats exist for report', async () => {
      const service = new ChatService();
      const report = createReport(1);

      // @ts-ignore
      service['reportRepository'] = {
        findReportById: jest.fn().mockResolvedValue(report)
      };

      // @ts-ignore
      service['chatRepository'] = {
        findByReportId: jest.fn().mockResolvedValue([])
      };

      const result = await service.findByReportId(1);

      expect(result).toHaveLength(0);
    });

    it('should return list of chats for a report', async () => {
      const service = new ChatService();
      const report = createReport(1);
      const tosm = createUser(1, 'tosm', UserType.TECHNICAL_STAFF_MEMBER);
      const citizen = createUser(2, 'citizen', UserType.CITIZEN);
      const extMaintainer = createUser(3, 'ext', UserType.EXTERNAL_MAINTAINER);

      const chats: ChatDAO[] = [
        {
          id: 1,
          tosm_user: tosm,
          second_user: citizen,
          report,
          chatType: ChatType.CITIZEN_TOSM
        } as ChatDAO,
        {
          id: 2,
          tosm_user: tosm,
          second_user: extMaintainer,
          report,
          chatType: ChatType.EXT_TOSM
        } as ChatDAO
      ];

      // @ts-ignore
      service['reportRepository'] = {
        findReportById: jest.fn().mockResolvedValue(report)
      };

      // @ts-ignore
      service['chatRepository'] = {
        findByReportId: jest.fn().mockResolvedValue(chats)
      };

      const result = await service.findByReportId(1);

      expect(result).toHaveLength(2);
      expect(result[0].chatType).toBe(ChatType.CITIZEN_TOSM);
      expect(result[1].chatType).toBe(ChatType.EXT_TOSM);
    });
  });

  describe('findChatById', () => {
    it('should throw NotFoundError when chat does not exist', async () => {
      const service = new ChatService();

      // @ts-ignore
      service['chatRepository'] = {
        findChatById: jest.fn().mockResolvedValue(null)
      };

      await expect(service.findChatById(NONEXISTENT_ID)).rejects.toThrow('Specified chat was not found');
    });

    it('should return chat when it exists', async () => {
      const service = new ChatService();
      const tosm = createUser(1, 'tosm', UserType.TECHNICAL_STAFF_MEMBER);
      const citizen = createUser(2, 'citizen', UserType.CITIZEN);
      const report = createReport(1);

      const chat: ChatDAO = {
        id: 1,
        tosm_user: tosm,
        second_user: citizen,
        report,
        chatType: ChatType.CITIZEN_TOSM
      } as ChatDAO;

      // @ts-ignore
      service['chatRepository'] = {
        findChatById: jest.fn().mockResolvedValue(chat)
      };

      const result = await service.findChatById(1);

      expect(result.id).toBe(1);
      expect(result.chatType).toBe(ChatType.CITIZEN_TOSM);
      expect(result.tosm_user.id).toBe(1);
      expect(result.second_user.id).toBe(2);
    });
  });
});
