import { MessageRepository } from '@repositories/MessageRepository';
import { MessageDAO } from '@daos/MessagesDAO';
import { UserDAO } from '@daos/UserDAO';
import { ChatDAO, ChatType } from '@daos/ChatsDAO';

describe('MessageRepository (mock)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  const createUser = (id: number, username: string): UserDAO => 
    ({ id, username, firstName: 'First', lastName: 'Last' } as UserDAO);

  const createChat = (id: number): ChatDAO => ({
    id,
    chatType: ChatType.CITIZEN_TOSM,
    tosm_user: createUser(1, 'tosm'),
    second_user: createUser(2, 'citizen'),
    report: { id: 1, title: 'Test Report' }
  } as ChatDAO);

  const mockDatabase = (fakeRepo: any) => {
    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);
  };

  describe('create', () => {
    it('should call underlying repo.save and return saved message', async () => {
      const sender = createUser(1, 'sender');
      const receiver = createUser(2, 'receiver');
      const chat = createChat(1);

      const messageToSave = {
        text: 'Test message',
        sender,
        receiver,
        chat
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

  describe('findByChatId', () => {
    test.each([
      ['undefined', undefined],
      ['null', null]
    ])('should throw error when chatId is %s', async (_, chatId) => {
      const repo = new MessageRepository();
      await expect(repo.findByChatId(chatId as any)).rejects.toThrow('findByChatId: chatId is required');
    });

    it('should return messages with all relations for valid chatId', async () => {
      const sender = createUser(1, 'sender');
      const receiver = createUser(2, 'receiver');
      const chat = createChat(1);

      const mockMessages = [
        {
          id: 1,
          text: 'First message',
          sender,
          receiver,
          chat,
          sentAt: new Date('2025-01-01T10:00:00')
        },
        {
          id: 2,
          text: 'Second message',
          sender: receiver,
          receiver: sender,
          chat,
          sentAt: new Date('2025-01-01T11:00:00')
        }
      ] as MessageDAO[];

      const fakeRepo: any = {
        find: jest.fn().mockResolvedValue(mockMessages)
      };

      mockDatabase(fakeRepo);

      const repo = new MessageRepository();
      const result = await repo.findByChatId(1);

      expect(fakeRepo.find).toHaveBeenCalledWith({
        where: { chat: { id: 1 } },
        relations: [
          'sender',
          'receiver',
          'chat',
          'chat.tosm_user',
          'chat.second_user',
          'chat.report',
          'chat.report.category',
          'chat.report.createdBy',
          'chat.report.assignedTo',
          'chat.report.coAssignedTo'
        ]
      });
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('First message');
      expect(result[1].text).toBe('Second message');
    });

    it('should return empty array when no messages exist for chat', async () => {
      const fakeRepo: any = {
        find: jest.fn().mockResolvedValue([])
      };

      mockDatabase(fakeRepo);

      const repo = new MessageRepository();
      const result = await repo.findByChatId(1);

      expect(result).toHaveLength(0);
    });
  });
});
