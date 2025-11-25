import { MessageDAO } from '@daos/MessagesDAO';
import { Repository } from 'typeorm';
import {AppDataSource} from "@database";
import {ReportDAO} from "@daos/ReportDAO";

export class MessageRepository {
    private repository: Repository<MessageDAO>;

    constructor() {
        this.repository = AppDataSource.getRepository(MessageDAO);
    }

    create = async (message: MessageDAO): Promise<MessageDAO> => {
        return await this.repository.save(message);
    }

    findByReportId = async (report: ReportDAO): Promise<MessageDAO[]> => {
        return await this.repository.find({
            where: { report: { id: report.id } },
            relations: ['sender', 'receiver', 'report', 'report.createdBy', 'report.category'],
            order: { sentAt: 'ASC' }
        });
    }

    findAllByUserId = async (userId: number): Promise<MessageDAO[]> => {
        return await this.repository.find({
            where: [
                { receiver: { id: userId } },
                { sender: { id: userId } }
            ],
            relations: ['sender', 'receiver', 'report', 'report.createdBy', 'report.category'],
            order: { sentAt: 'ASC' }
        });
    }
}

export const messageRepository = new MessageRepository();