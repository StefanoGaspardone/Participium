import { MessageService } from '@services/MessageService';
import { CreateMessageDTO } from '@dtos/MessageDTO';
import { MessageDAO } from '@daos/MessagesDAO';
import { UserDAO } from '@daos/UserDAO';
import { ChatDAO, ChatType } from '@daos/ChatsDAO';

// Mock the singletons
jest.mock('@repositories/ChatRepository');
jest.mock('@repositories/MessageRepository');

import { chatRepository } from '@repositories/ChatRepository';
import { messageRepository } from '@repositories/MessageRepository';

describe('MessageService (mock)', () => {
  const createUser = (id: number, username: string): UserDAO => 
    ({ id, username, firstName: 'First', lastName: 'Last' } as UserDAO);

  const createChat = (id: number, tosm_user: UserDAO, second_user: UserDAO): ChatDAO => ({
    id,
    chatType: ChatType.CITIZEN_TOSM,
    tosm_user,
    second_user,
    report: { id: 1, title: 'Test Report' }
  } as ChatDAO);

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

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
        chatId: 1
      };

      await expect(service.createMessage(createMessageDTO)).rejects.toThrow('Sender not found');
    });

    it('should throw NotFoundError when chat does not exist', async () => {
      const service = new MessageService();
      const sender = createUser(1, 'sender');

      // @ts-ignore
      service['userRepository'] = {
        findUserById: jest.fn().mockResolvedValue(sender)
      };

      // @ts-ignore
      service['chatRepository'] = {
        findChatById: jest.fn().mockResolvedValue(null)
      };

      const createMessageDTO: CreateMessageDTO = {
        text: 'Hello',
        senderId: 1,
        receiverId: 2,
        chatId: 999
      };

      await expect(service.createMessage(createMessageDTO)).rejects.toThrow('Chat not found');
    });

    it('should throw NotFoundError when receiver does not exist', async () => {
      const service = new MessageService();
      const sender = createUser(1, 'sender');
      const receiver = createUser(2, 'receiver');
      const chat = createChat(1, sender, receiver);

      // @ts-ignore
      service['userRepository'] = {
        findUserById: jest.fn()
          .mockResolvedValueOnce(sender)
          .mockResolvedValueOnce(null)
      };

      // @ts-ignore
      service['chatRepository'] = {
        findChatById: jest.fn().mockResolvedValue(chat)
      };

      await expect(service.createMessage({
        text: 'Hello',
        senderId: 1,
        receiverId: 999,
        chatId: 1
      })).rejects.toThrow('Receiver not found');
    });

    it('should throw BadRequestError when sender is not part of the chat', async () => {
      const service = new MessageService();
      const sender = createUser(1, 'sender');
      const receiver = createUser(2, 'receiver');
      const outsider = createUser(3, 'outsider');
      const chat = createChat(1, sender, receiver);

      // @ts-ignore
      service['userRepository'] = {
        findUserById: jest.fn()
          .mockResolvedValueOnce(outsider) // sender lookup
          .mockResolvedValueOnce(receiver) // receiver lookup
      };

      // @ts-ignore
      service['chatRepository'] = {
        findChatById: jest.fn().mockResolvedValue(chat)
      };

      await expect(service.createMessage({
        text: 'Hello',
        senderId: 3,
        receiverId: 2,
        chatId: 1
      })).rejects.toThrow('The sender inserted is not part of the chat');
    });

    it('should throw BadRequestError when receiver is not part of the chat', async () => {
      const service = new MessageService();
      const sender = createUser(1, 'sender');
      const receiver = createUser(2, 'receiver');
      const outsider = createUser(3, 'outsider');
      const chat = createChat(1, sender, receiver);

      // @ts-ignore
      service['userRepository'] = {
        findUserById: jest.fn()
          .mockResolvedValueOnce(sender)
          .mockResolvedValueOnce(outsider)
      };

      // @ts-ignore
      service['chatRepository'] = {
        findChatById: jest.fn().mockResolvedValue(chat)
      };

      await expect(service.createMessage({
        text: 'Hello',
        senderId: 1,
        receiverId: 3,
        chatId: 1
      })).rejects.toThrow('The receiver is not part of the chat');
    });

    it('should create message when all entities exist and users are in chat', async () => {
      const service = new MessageService();
      const sender = createUser(1, 'sender');
      const receiver = createUser(2, 'receiver');
      const chat = createChat(1, sender, receiver);
      
      const savedMessage = {
        id: 10,
        text: 'Hello',
        sender,
        receiver,
        chat,
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
      service['chatRepository'] = {
        findChatById: jest.fn().mockResolvedValue(chat)
      };

      // @ts-ignore
      service['messageRepository'] = {
        create: createMock
      };

      const result = await service.createMessage({
        text: 'Hello',
        senderId: 1,
        receiverId: 2,
        chatId: 1
      });

      expect(createMock).toHaveBeenCalledTimes(1);
      const passedMessage = createMock.mock.calls[0][0] as MessageDAO;
      expect(passedMessage.text).toBe('Hello');
      expect(passedMessage.sender).toEqual(sender);
      expect(passedMessage.receiver).toEqual(receiver);
      expect(passedMessage.chat).toEqual(chat);
      expect(result.id).toBe(10);
      expect(result.sender).toBe(1);
      expect(result.receiver).toBe(2);
      expect(result.chat).toBe(1);
    });
  });

  describe('getChatMessages', () => {
    it('should throw NotFoundError when chat does not exist', async () => {
      const service = new MessageService();

      (chatRepository.findChatById as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(service.getChatMessages(999)).rejects.toThrow('Chat not found');
    });

    it('should return empty array when no messages exist for chat', async () => {
      const service = new MessageService();
      const chat = { id: 1 } as ChatDAO;

      (chatRepository.findChatById as jest.Mock) = jest.fn().mockResolvedValue(chat);
      (messageRepository.findByChatId as jest.Mock) = jest.fn().mockResolvedValue([]);

      const result = await service.getChatMessages(1);

      expect(result).toHaveLength(0);
    });

    it('should return list of messages for a chat', async () => {
      const service = new MessageService();
      const sender = createUser(1, 'sender');
      const receiver = createUser(2, 'receiver');
      const chat = createChat(1, sender, receiver);

      const messages: MessageDAO[] = [
        {
          id: 1,
          text: 'First message',
          sender,
          receiver,
          chat,
          sentAt: new Date('2025-01-01')
        } as MessageDAO,
        {
          id: 2,
          text: 'Second message',
          sender: receiver,
          receiver: sender,
          chat,
          sentAt: new Date('2025-01-02')
        } as MessageDAO
      ];

      (chatRepository.findChatById as jest.Mock) = jest.fn().mockResolvedValue(chat);
      (messageRepository.findByChatId as jest.Mock) = jest.fn().mockResolvedValue(messages);

      const result = await service.getChatMessages(1);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('First message');
      expect(result[0].sender).toBe(1);
      expect(result[0].receiver).toBe(2);
      expect(result[1].text).toBe('Second message');
      expect(result[1].sender).toBe(2);
      expect(result[1].receiver).toBe(1);
    });
  });
});
