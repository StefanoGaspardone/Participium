import { ChatRepository } from '@repositories/ChatRepository';
import { ChatDAO, ChatType } from '@daos/ChatsDAO';
import { UserDAO, UserType } from '@daos/UserDAO';
import { ReportDAO } from '@daos/ReportDAO';

describe('ChatRepository (mock)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  const createUser = (id: number, username: string, userType: UserType): UserDAO => 
    ({ id, username, firstName: 'First', lastName: 'Last', userType } as UserDAO);

  const createReport = (id: number): ReportDAO => ({
    id,
    title: 'Test Report',
    category: { id: 1, name: 'Category' }
  } as ReportDAO);

  const createChat = (id: number, tosm: UserDAO, secondUser: UserDAO, report: ReportDAO): ChatDAO => ({
    id,
    chatType: ChatType.CITIZEN_TOSM,
    tosm_user: tosm,
    second_user: secondUser,
    report
  } as ChatDAO);

  const mockDatabase = (fakeRepo: any) => {
    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);
  };

  describe('create', () => {
    it('should call underlying repo.save and return saved chat', async () => {
      const tosm = createUser(1, 'tosm', UserType.TECHNICAL_STAFF_MEMBER);
      const citizen = createUser(2, 'citizen', UserType.CITIZEN);
      const report = createReport(1);

      const chatToSave = {
        tosm_user: tosm,
        second_user: citizen,
        report,
        chatType: ChatType.CITIZEN_TOSM
      } as ChatDAO;

      const savedChat = {
        ...chatToSave,
        id: 10
      } as ChatDAO;

      const fakeRepo: any = {
        save: jest.fn().mockResolvedValue(savedChat)
      };

      mockDatabase(fakeRepo);

      const repo = new ChatRepository();
      const result = await repo.create(chatToSave);

      expect(fakeRepo.save).toHaveBeenCalledWith(chatToSave);
      expect(result).toEqual(savedChat);
      expect(result.id).toBe(10);
    });

    it('should propagate errors from underlying repo.save', async () => {
      const fakeRepo: any = {
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      mockDatabase(fakeRepo);

      const repo = new ChatRepository();
      const chat = { chatType: ChatType.CITIZEN_TOSM } as ChatDAO;

      await expect(repo.create(chat)).rejects.toThrow('Database error');
    });
  });

  describe('findByReportId', () => {
    it('should use query builder with correct joins and where clause', async () => {
      const tosm = createUser(1, 'tosm', UserType.TECHNICAL_STAFF_MEMBER);
      const citizen = createUser(2, 'citizen', UserType.CITIZEN);
      const extMaintainer = createUser(3, 'ext', UserType.EXTERNAL_MAINTAINER);
      const report = createReport(1);

      const mockChats = [
        createChat(1, tosm, citizen, report),
        createChat(2, tosm, extMaintainer, report)
      ];

      const queryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockChats)
      };

      const fakeRepo: any = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder)
      };

      mockDatabase(fakeRepo);

      const repo = new ChatRepository();
      const result = await repo.findByReportId(1);

      expect(fakeRepo.createQueryBuilder).toHaveBeenCalledWith('chat');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(6);
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('chat.tosm_user', 'tosm_user');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('chat.second_user', 'second_user');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('chat.report', 'report');
      expect(queryBuilder.where).toHaveBeenCalledWith('report.id = :reportId', { reportId: 1 });
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('chat.id', 'ASC');
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no chats exist for report', async () => {
      const queryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([])
      };

      const fakeRepo: any = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder)
      };

      mockDatabase(fakeRepo);

      const repo = new ChatRepository();
      const result = await repo.findByReportId(999);

      expect(result).toHaveLength(0);
    });
  });

  describe('findAllByUserId', () => {
    it('should use query builder with OR condition for tosm_user and second_user', async () => {
      const tosm = createUser(1, 'tosm', UserType.TECHNICAL_STAFF_MEMBER);
      const citizen = createUser(2, 'citizen', UserType.CITIZEN);
      const report1 = createReport(1);
      const report2 = createReport(2);

      const mockChats = [
        createChat(1, tosm, citizen, report1),
        createChat(2, tosm, citizen, report2)
      ];

      const queryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockChats)
      };

      const fakeRepo: any = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder)
      };

      mockDatabase(fakeRepo);

      const repo = new ChatRepository();
      const result = await repo.findAllByUserId(2);

      expect(fakeRepo.createQueryBuilder).toHaveBeenCalledWith('chat');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(6);
      expect(queryBuilder.where).toHaveBeenCalledWith(
          "(tosm_user.id = :userId OR second_user.id = :userId)", {"userId": 2}
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('chat.id', 'ASC');
      expect(result).toHaveLength(2);
    });

    it('should return empty array when user has no chats', async () => {
      const queryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([])
      };

      const fakeRepo: any = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder)
      };

      mockDatabase(fakeRepo);

      const repo = new ChatRepository();
      const result = await repo.findAllByUserId(999);

      expect(result).toHaveLength(0);
    });
  });

  describe('findChatById', () => {
    it('should return chat with relations when it exists', async () => {
      const tosm = createUser(1, 'tosm', UserType.TECHNICAL_STAFF_MEMBER);
      const citizen = createUser(2, 'citizen', UserType.CITIZEN);
      const report = createReport(1);
      const chat = createChat(1, tosm, citizen, report);

      const fakeRepo: any = {
        findOne: jest.fn().mockResolvedValue(chat)
      };

      mockDatabase(fakeRepo);

      const repo = new ChatRepository();
      const result = await repo.findChatById(1);

      expect(fakeRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['tosm_user', 'second_user', 'report', 'report.category', 'report.createdBy', 'report.assignedTo', 'report.coAssignedTo']
      });
      expect(result).toEqual(chat);
    });

    it('should return null when chat does not exist', async () => {
      const fakeRepo: any = {
        findOne: jest.fn().mockResolvedValue(null)
      };

      mockDatabase(fakeRepo);

      const repo = new ChatRepository();
      const result = await repo.findChatById(999);

      expect(fakeRepo.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['tosm_user', 'second_user', 'report', 'report.category', 'report.createdBy', 'report.assignedTo', 'report.coAssignedTo']
      });
      expect(result).toBeNull();
    });
  });
});
