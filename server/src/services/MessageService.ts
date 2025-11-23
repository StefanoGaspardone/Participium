import {messageRepository, MessageRepository} from '@repositories/MessageRepository';
import {userRepository, UserRepository} from '@repositories/UserRepository';
import {reportRepository, ReportRepository} from '@repositories/ReportRepository';
import {CreateMessageDTO, messageDAOtoDTO, MessageDTO} from '@dtos/MessageDTO';
import { MessageDAO } from '@daos/MessagesDAO';
import {NotFoundError} from "@errors/NotFoundError";

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

}

export const messageService = new MessageService();