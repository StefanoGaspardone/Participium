import {Repository} from "typeorm";
import {NotificationDAO} from "@daos/NotificationsDAO";
import {AppDataSource} from "@database";
import {UserDAO} from "@daos/UserDAO";


export class NotificationRepository {

    private readonly repo: Repository<NotificationDAO>

    constructor() {
        this.repo = AppDataSource.getRepository(NotificationDAO);
    }

    findAllNotifications = async (): Promise<NotificationDAO[]> => {
        return this.repo.find({relations: ['user', 'report', 'report.category', 'report.createdBy', 'message', 'message.sender']});
    }

    findNotificationById = async (id: number): Promise<NotificationDAO | null> => {
        return await this.repo.findOne({ where: { id }});
    }

    createNotification = async (notification: NotificationDAO): Promise<NotificationDAO> => {
        const saved = await this.repo.save(notification);
        const newNotification = await this.repo.findOne({
            where: { id: saved.id },
            relations: ['user', 'report', 'report.category', 'report.createdBy', 'message', 'message.sender']
        });
        return newNotification!;
    }

    updateNotificationSeen = async (notification: NotificationDAO): Promise<void> => {
        await this.repo.update({id: notification.id}, { seen: true });
    }

    findMyNotifications = async (user: UserDAO): Promise<NotificationDAO[]> => {
        return this.repo.find({
            where: { user: { id: user.id } },
            relations: ['user', 'report', 'report.category', 'report.createdBy', 'message', 'message.sender'],
            order: { createdAt: 'DESC' }
        });
    }
}

export const notificationRepository = new NotificationRepository();