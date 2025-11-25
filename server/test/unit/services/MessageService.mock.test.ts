import { MessageService } from '@services/MessageService';
import { CreateMessageDTO } from '@dtos/MessageDTO';
import { MessageDAO } from '@daos/MessagesDAO';
import { UserDAO } from '@daos/UserDAO';
import { ReportDAO } from '@daos/ReportDAO';

describe('MessageService (mock)', () => {
  const createUser = (id: number, username: string): UserDAO => 
    ({ id, username, firstName: 'First', lastName: 'Last' } as UserDAO);

  const createReport = (id: number, createdBy: UserDAO): ReportDAO => ({
    id,
    title: 'Test Report',
    category: { id: 1, name: 'Category' },
    createdBy,
    createdAt: new Date(),
    lat: 45.07,
    long: 7.65
  } as ReportDAO);

  describe('createMessage', () => {
    it('should throw NotFoundError when sender does not exist', async () => {
      const service = new MessageService();

      // @ts-ignore
      service['userRepository'] = {
        findUserById: jest.fn().mockResolvedValue(null)
      };

      const createMessageDTO: CreateMessageDTO = {
        text: 'Hello',
        senderId: 1,
        receiverId: 2,
        reportId: 1
      };

      await expect(service.createMessage(createMessageDTO)).rejects.toThrow('Sender not found');
    });

    it('should throw NotFoundError when report does not exist', async () => {
      const service = new MessageService();

      // @ts-ignore
      service['userRepository'] = {
        findUserById: jest.fn().mockResolvedValue(createUser(1, 'sender'))
      };

      // @ts-ignore
      service['reportRepository'] = {
        findReportById: jest.fn().mockResolvedValue(null)
      };

      const createMessageDTO: CreateMessageDTO = {
        text: 'Hello',
        senderId: 1,
        receiverId: 2,
        reportId: 999
      };

      await expect(service.createMessage(createMessageDTO)).rejects.toThrow('Report not found');
    });

    it('should throw NotFoundError when receiver does not exist', async () => {
      const service = new MessageService();
      const sender = createUser(1, 'sender');

      // @ts-ignore
      service['userRepository'] = {
        findUserById: jest.fn()
          .mockResolvedValueOnce(sender)
          .mockResolvedValueOnce(null)
      };

      // @ts-ignore
      service['reportRepository'] = {
        findReportById: jest.fn().mockResolvedValue(createReport(1, sender))
      };

      await expect(service.createMessage({
        text: 'Hello',
        senderId: 1,
        receiverId: 999,
        reportId: 1
      })).rejects.toThrow('Receiver not found');
    });

    it('should create message when all entities exist', async () => {
      const service = new MessageService();
      const sender = createUser(1, 'sender');
      const receiver = createUser(2, 'receiver');
      const report = createReport(1, sender);
      
      const savedMessage = {
        id: 10,
        text: 'Hello',
        sender,
        receiver,
        report,
        sentAt: new Date()
      } as MessageDAO;

      const createMock = jest.fn().mockResolvedValue(savedMessage);

      // @ts-ignore
      service['userRepository'] = {
        findUserById: jest.fn()
          .mockResolvedValueOnce(sender)
          .mockResolvedValueOnce(receiver)
      };

      // @ts-ignore
      service['reportRepository'] = {
        findReportById: jest.fn().mockResolvedValue(report)
      };

      // @ts-ignore
      service['messageRepository'] = {
        create: createMock
      };

      const result = await service.createMessage({
        text: 'Hello',
        senderId: 1,
        receiverId: 2,
        reportId: 1
      });

      expect(createMock).toHaveBeenCalled();
      const passedMessage = createMock.mock.calls[0][0] as MessageDAO;
      expect(passedMessage.text).toBe('Hello');
      expect(passedMessage.sender).toEqual(sender);
      expect(passedMessage.receiver).toEqual(receiver);
      expect(passedMessage.report).toEqual(report);
      expect(result.id).toBe(10);
    });
  });

  describe('getMessagesByReportId', () => {
    it('should throw error when report does not exist', async () => {
      const service = new MessageService();

      // @ts-ignore
      service['reportRepository'] = {
        findReportById: jest.fn().mockResolvedValue(null)
      };

      await expect(service.getMessagesByReportId(999)).rejects.toThrow('Report not found');
    });

    it('should return empty array when no messages exist for report', async () => {
      const service = new MessageService();

      // @ts-ignore
      service['reportRepository'] = {
        findReportById: jest.fn().mockResolvedValue({ id: 1 })
      };

      // @ts-ignore
      service['messageRepository'] = {
        findByReportId: jest.fn().mockResolvedValue([])
      };

      const result = await service.getMessagesByReportId(1);

      expect(result).toHaveLength(0);
    });

    it('should return list of messages for a report', async () => {
      const service = new MessageService();
      const sender = createUser(1, 'sender');
      const receiver = createUser(2, 'receiver');
      const report = createReport(1, sender);

      const messages: MessageDAO[] = [
        {
          id: 1,
          text: 'First message',
          sender,
          receiver,
          report,
          sentAt: new Date('2025-01-01')
        } as MessageDAO,
        {
          id: 2,
          text: 'Second message',
          sender: receiver,
          receiver: sender,
          report,
          sentAt: new Date('2025-01-02')
        } as MessageDAO
      ];

      // @ts-ignore
      service['reportRepository'] = {
        findReportById: jest.fn().mockResolvedValue(report)
      };

      // @ts-ignore
      service['messageRepository'] = {
        findByReportId: jest.fn().mockResolvedValue(messages)
      };

      const result = await service.getMessagesByReportId(1);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('First message');
      expect(result[1].text).toBe('Second message');
    });
  });

  describe('getChats', () => {
    it('should return empty array when user has no messages', async () => {
      const service = new MessageService();

      // @ts-ignore
      service['messageRepository'] = {
        findAllByUserId: jest.fn().mockResolvedValue([])
      };

      const result = await service.getChats(1);

      expect(result).toHaveLength(0);
    });

    it('should group messages by chat participants and sort correctly', async () => {
      const service = new MessageService();
      const user1 = createUser(1, 'user1');
      const user2 = createUser(2, 'user2');
      const report = createReport(1, user1);

      const messages: MessageDAO[] = [
        {
          id: 1,
          text: 'Message 1',
          sender: user1,
          receiver: user2,
          report,
          sentAt: new Date('2025-01-01T10:00:00')
        } as MessageDAO,
        {
          id: 2,
          text: 'Message 2',
          sender: user2,
          receiver: user1,
          report,
          sentAt: new Date('2025-01-01T11:00:00')
        } as MessageDAO
      ];

      // @ts-ignore
      service['messageRepository'] = {
        findAllByUserId: jest.fn().mockResolvedValue(messages)
      };

      const result = await service.getChats(1);

      expect(result).toHaveLength(1);
      expect(result[0].messages).toHaveLength(2);
      expect(result[0].users).toHaveLength(2);
      expect(result[0].report.id).toBe(1);
    });

    it('should sort messages within each chat by sentAt', async () => {
      const service = new MessageService();
      const user1 = createUser(1, 'user1');
      const user2 = createUser(2, 'user2');
      const report = createReport(1, user1);

      const messages: MessageDAO[] = [
        {
          id: 2,
          text: 'Later message',
          sender: user2,
          receiver: user1,
          report,
          sentAt: new Date('2025-01-01T11:00:00')
        } as MessageDAO,
        {
          id: 1,
          text: 'Earlier message',
          sender: user1,
          receiver: user2,
          report,
          sentAt: new Date('2025-01-01T10:00:00')
        } as MessageDAO
      ];

      // @ts-ignore
      service['messageRepository'] = {
        findAllByUserId: jest.fn().mockResolvedValue(messages)
      };

      const result = await service.getChats(1);

      expect(result[0].messages[0].text).toBe('Earlier message');
      expect(result[0].messages[1].text).toBe('Later message');
    });

    it('should sort chats by most recent message', async () => {
      const service = new MessageService();
      const user1 = createUser(1, 'user1');
      const user2 = createUser(2, 'user2');
      const user3 = createUser(3, 'user3');
      const report1 = createReport(1, user1);
      const report2 = createReport(2, user1);

      const messages: MessageDAO[] = [
        {
          id: 1,
          text: 'Old message',
          sender: user1,
          receiver: user2,
          report: report1,
          sentAt: new Date('2025-01-01T10:00:00')
        } as MessageDAO,
        {
          id: 2,
          text: 'Recent message',
          sender: user1,
          receiver: user3,
          report: report2,
          sentAt: new Date('2025-01-02T10:00:00')
        } as MessageDAO
      ];

      // @ts-ignore
      service['messageRepository'] = {
        findAllByUserId: jest.fn().mockResolvedValue(messages)
      };

      const result = await service.getChats(1);

      expect(result).toHaveLength(2);
      expect(result[0].report.id).toBe(2);
      expect(result[1].report.id).toBe(1);
    });

    it('should identify the other user correctly', async () => {
      const service = new MessageService();
      const currentUser = createUser(5, 'current');
      const otherUser = createUser(10, 'other');
      const report = createReport(1, currentUser);

      const messages: MessageDAO[] = [
        {
          id: 1,
          text: 'Message',
          sender: currentUser,
          receiver: otherUser,
          report,
          sentAt: new Date('2025-01-01T10:00:00')
        } as MessageDAO
      ];

      // @ts-ignore
      service['messageRepository'] = {
        findAllByUserId: jest.fn().mockResolvedValue(messages)
      };

      const result = await service.getChats(5);

      expect(result).toHaveLength(1);
      expect(result[0].users).toHaveLength(2);
      const otherUserInChat = result[0].users.find(u => u.id === 10);
      expect(otherUserInChat).toBeDefined();
    });

    it('should handle multiple messages in the same chat', async () => {
      const service = new MessageService();
      const user1 = createUser(1, 'user1');
      const user2 = createUser(2, 'user2');
      const report = createReport(1, user1);

      const messages: MessageDAO[] = [
        {
          id: 1,
          text: 'First message',
          sender: user1,
          receiver: user2,
          report,
          sentAt: new Date('2025-01-01T10:00:00')
        } as MessageDAO,
        {
          id: 2,
          text: 'Second message',
          sender: user2,
          receiver: user1,
          report,
          sentAt: new Date('2025-01-01T11:00:00')
        } as MessageDAO,
        {
          id: 3,
          text: 'Third message',
          sender: user1,
          receiver: user2,
          report,
          sentAt: new Date('2025-01-01T12:00:00')
        } as MessageDAO
      ];

      // @ts-ignore
      service['messageRepository'] = {
        findAllByUserId: jest.fn().mockResolvedValue(messages)
      };

      const result = await service.getChats(1);

      expect(result).toHaveLength(1);
      expect(result[0].messages).toHaveLength(3);
      expect(result[0].messages[0].text).toBe('First message');
      expect(result[0].messages[2].text).toBe('Third message');
    });
  });
});
