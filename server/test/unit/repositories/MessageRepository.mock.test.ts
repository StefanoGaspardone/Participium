import { MessageRepository } from '@repositories/MessageRepository';
import { MessageDAO } from '@daos/MessagesDAO';
import { ReportDAO } from '@daos/ReportDAO';
import { UserDAO } from '@daos/UserDAO';

describe('MessageRepository (mock)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  const createUser = (id: number, username: string): UserDAO => 
    ({ id, username, firstName: 'First', lastName: 'Last' } as UserDAO);

  const createReport = (id: number): ReportDAO => 
    ({ id, title: 'Test Report', createdBy: createUser(1, 'creator'), category: { id: 1, name: 'Category' } } as ReportDAO);

  const mockDatabase = (fakeRepo: any) => {
    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);
  };

  describe('create', () => {
    it('should call underlying repo.save and return saved message', async () => {
      const sender = createUser(1, 'sender');
      const receiver = createUser(2, 'receiver');
      const report = createReport(1);

      const messageToSave = {
        text: 'Test message',
        sender,
        receiver,
        report
      } as MessageDAO;

      const savedMessage = {
        ...messageToSave,
        id: 10,
        sentAt: new Date()
      } as MessageDAO;

      const fakeRepo: any = {
        save: jest.fn().mockResolvedValue(savedMessage)
      };

      mockDatabase(fakeRepo);

      const repo = new MessageRepository();
      const result = await repo.create(messageToSave);

      expect(fakeRepo.save).toHaveBeenCalledWith(messageToSave);
      expect(result).toEqual(savedMessage);
      expect(result.id).toBe(10);
    });

    it('should propagate errors from underlying repo.save', async () => {
      const fakeRepo: any = {
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      mockDatabase(fakeRepo);

      const repo = new MessageRepository();
      const message = { text: 'Test' } as MessageDAO;

      await expect(repo.create(message)).rejects.toThrow('Database error');
    });
  });

  describe('findByReportId', () => {
    it('should return messages ordered by sentAt with all relations', async () => {
      const sender = createUser(1, 'sender');
      const receiver = createUser(2, 'receiver');
      const report = createReport(1);

      const mockMessages = [
        {
          id: 1,
          text: 'First message',
          sender,
          receiver,
          report,
          sentAt: new Date('2025-01-01T10:00:00')
        },
        {
          id: 2,
          text: 'Second message',
          sender: receiver,
          receiver: sender,
          report,
          sentAt: new Date('2025-01-01T11:00:00')
        }
      ] as MessageDAO[];

      const fakeRepo: any = {
        find: jest.fn().mockResolvedValue(mockMessages)
      };

      mockDatabase(fakeRepo);

      const repo = new MessageRepository();
      const result = await repo.findByReportId(report);

      expect(fakeRepo.find).toHaveBeenCalledWith({
        where: { report: { id: report.id } },
        relations: ['sender', 'receiver', 'report', 'report.createdBy', 'report.category'],
        order: { sentAt: 'ASC' }
      });
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('First message');
      expect(result[1].text).toBe('Second message');
    });

    it('should return empty array when no messages exist for report', async () => {
      const fakeRepo: any = {
        find: jest.fn().mockResolvedValue([])
      };

      mockDatabase(fakeRepo);

      const repo = new MessageRepository();
      const result = await repo.findByReportId(createReport(1));

      expect(result).toHaveLength(0);
    });
  });

  describe('findAllByUserId', () => {
    it('should return messages where user is sender or receiver with correct query', async () => {
      const user1 = createUser(1, 'user1');
      const user2 = createUser(2, 'user2');
      const report = createReport(1);

      const mockMessages = [
        {
          id: 1,
          text: 'Sent message',
          sender: user1,
          receiver: user2,
          report,
          sentAt: new Date('2025-01-01T10:00:00')
        },
        {
          id: 2,
          text: 'Received message',
          sender: user2,
          receiver: user1,
          report,
          sentAt: new Date('2025-01-01T11:00:00')
        }
      ] as MessageDAO[];

      const fakeRepo: any = {
        find: jest.fn().mockResolvedValue(mockMessages)
      };

      mockDatabase(fakeRepo);

      const repo = new MessageRepository();
      const result = await repo.findAllByUserId(1);

      expect(fakeRepo.find).toHaveBeenCalledWith({
        where: [
          { receiver: { id: 1 } },
          { sender: { id: 1 } }
        ],
        relations: ['sender', 'receiver', 'report'],
        order: { sentAt: 'ASC' }
      });
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Sent message');
      expect(result[1].text).toBe('Received message');
    });

    it('should return empty array when user has no messages', async () => {
      const fakeRepo: any = {
        find: jest.fn().mockResolvedValue([])
      };

      mockDatabase(fakeRepo);

      const repo = new MessageRepository();
      const result = await repo.findAllByUserId(999);

      expect(result).toHaveLength(0);
    });
  });
});
