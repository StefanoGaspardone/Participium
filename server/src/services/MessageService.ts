import {messageRepository, MessageRepository} from '@repositories/MessageRepository';
import {userRepository, UserRepository} from '@repositories/UserRepository';
import {reportRepository, ReportRepository} from '@repositories/ReportRepository';
import {CreateMessageDTO, messageDAOtoDTO, messageDAOtoDTOforChats, MessageDTO, MessageDTOforChats} from '@dtos/MessageDTO';
import { MessageDAO } from '@daos/MessagesDAO';
import {NotFoundError} from "@errors/NotFoundError";
import { createReportDTO, ReportDTO } from '@dtos/ReportDTO';
import { MapUserDAOtoDTO, UserDTO } from '@dtos/UserDTO';
import { ReportDAO } from '@daos/ReportDAO';
import { UserDAO } from '@daos/UserDAO';
import { ChatRepository, chatRepository } from '@repositories/ChatRepository';
import { BadRequestError } from '@errors/BadRequestError';

export class MessageService {
    private messageRepository: MessageRepository;
    private userRepository: UserRepository;
    private reportRepository: ReportRepository;
    private chatRepository: ChatRepository;

    constructor() {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.reportRepository = reportRepository;
        this.chatRepository = chatRepository;
    }

    /**
     * 
     * @param createMessageDTO: CreateMessageDTO, contains the "basic" information to create/send
     * a new message (text, senderId, receiverId, chatId)
     * @returns the MessageDTO instance of the newly created/sent message
     */
    async createMessage(createMessageDTO: CreateMessageDTO): Promise<MessageDTOforChats> {
        const sender = await this.userRepository.findUserById(createMessageDTO.senderId);
        if (!sender) {
            throw new NotFoundError('Sender not found');
        }
        const chat = await this.chatRepository.findChatById(createMessageDTO.chatId);
        if (!chat) {
            throw new NotFoundError('Chat not found');
        }
        const receiver = await this.userRepository.findUserById(createMessageDTO.receiverId);
        if (!receiver) {
            throw new NotFoundError('Receiver not found');
        }
        if(chat.second_user.id !== sender.id && chat.tosm_user.id !== sender.id) {
            throw new BadRequestError('The sender inserted is not part of the chat');
        }
        if(chat.second_user.id !== receiver.id && chat.tosm_user.id !== receiver.id) {
            throw new BadRequestError('The receiver is not part of the chat');
        }

        const message = {} as MessageDAO;
        message.receiver = receiver;
        message.sender = sender;
        message.chat = chat;
        message.text = createMessageDTO.text;

        const savedMessage = await this.messageRepository.create(message);
        return messageDAOtoDTOforChats(savedMessage);
    }

    /**
     * function to retrieve all the messages of a specified chat
     * @param chatId: number, the identifier of the chat in the DB 
     * @returns MessageDTO[] array containing the messages of the specified chat 
     */
    async getChatMessages (chatId: number): Promise<MessageDTOforChats[]> {
        const chat = await chatRepository.findChatById(chatId);
        if(!chat) {
            throw new NotFoundError('Chat not found');
        }
        const messages = await messageRepository.findByChatId(chat.id);
        return messages.map((m) => messageDAOtoDTOforChats(m));
    }
}

export const messageService = new MessageService();