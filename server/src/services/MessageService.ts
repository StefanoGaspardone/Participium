import {messageRepository, MessageRepository} from '@repositories/MessageRepository';
import {userRepository, UserRepository} from '@repositories/UserRepository';
import {reportRepository, ReportRepository} from '@repositories/ReportRepository';
import {ChatDTO, CreateMessageDTO, messageDAOtoDTO, MessageDTO} from '@dtos/MessageDTO';
import { MessageDAO } from '@daos/MessagesDAO';
import {NotFoundError} from "@errors/NotFoundError";
import { createReportDTO, ReportDTO } from '@dtos/ReportDTO';
import { MapUserDAOtoDTO, UserDTO } from '@dtos/UserDTO';
import { ReportDAO } from '@daos/ReportDAO';
import { UserDAO } from '@daos/UserDAO';

export class MessageService {
    private messageRepository: MessageRepository;
    private userRepository: UserRepository;
    private reportRepository: ReportRepository;

    constructor() {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.reportRepository = reportRepository;
    }

    async createMessage(createMessageDTO: CreateMessageDTO): Promise<MessageDTO> {
        const sender = await this.userRepository.findUserById(createMessageDTO.senderId);
        if (!sender) {
            throw new NotFoundError('Sender not found');
        }
        const report = await this.reportRepository.findReportById(createMessageDTO.reportId);
        if (!report) {
            throw new NotFoundError('Report not found');
        }

        const receiver = await this.userRepository.findUserById(createMessageDTO.receiverId);
        if (!receiver) {
            throw new NotFoundError('Receiver not found');
        }

        const message = {} as MessageDAO;
        message.receiver = receiver;
        message.sender = sender;
        message.report = report;
        message.text = createMessageDTO.text;

        const savedMessage = await this.messageRepository.create(message);
        return messageDAOtoDTO(savedMessage);
    }

    async getMessagesByReportId(reportId: number): Promise<MessageDTO[]> {
        const report = await this.reportRepository.findReportById(reportId);
        if (!report) {
            throw new Error('Report not found');
        }
        const messages = await this.messageRepository.findByReportId(report);
        return messages.map(messageDAOtoDTO);
    }

    getChats = async (userId: number): Promise<ChatDTO[]> => {
        const messages = await this.messageRepository.findAllByUserId(userId);
        const chatMap: Map<string, { report: ReportDAO | null, messages: MessageDAO[], otherUser: UserDAO }> = new Map();

        for(const message of messages) {
            const otherUser = message.sender.id === userId ? message.receiver : message.sender;
            const otherUserId = otherUser.id;
        
            const chatKey = userId < otherUserId ? `${userId}_${otherUserId}` : `${otherUserId}_${userId}`;
        
            if(!chatMap.has(chatKey)) {
                chatMap.set(chatKey, {
                    report: null,
                    messages: [],
                    otherUser: otherUser
                });
            }
        
            const chatEntry = chatMap.get(chatKey)!;
            chatEntry.messages.push(message);
        
            if(message.report) chatEntry.report = message.report;
        }
    
        const chats: ChatDTO[] = Array.from(chatMap.values()).map(entry => {
            entry.messages.sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());

            return {
                report: createReportDTO(entry.report!),
                users: [
                    MapUserDAOtoDTO(messages.find(m => m.sender.id === userId || m.receiver.id === userId)!.sender), // Trova l'oggetto UserDTO dell'utente corrente
                    MapUserDAOtoDTO(entry.otherUser)
                ],
                messages: entry.messages.map(messageDAOtoDTO)
            };
        });
    
        chats.sort((a, b) => {
            const lastMsgA = a.messages[a.messages.length - 1].sentAt.getTime();
            const lastMsgB = b.messages[b.messages.length - 1].sentAt.getTime();
            return lastMsgB - lastMsgA;
        });

        return chats;
    }
}

export const messageService = new MessageService();