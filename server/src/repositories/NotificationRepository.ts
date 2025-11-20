import {Repository} from "typeorm";
import {NotificationDAO} from "@daos/Notifications";
import {AppDataSource} from "@database";


export class NotificationRepository {

    private repo: Repository<NotificationDAO>

    constructor() {
        this.repo = AppDataSource.getRepository(NotificationDAO);
    }

    findAllNotifications = async (): Promise<NotificationDAO[]> => {
        return this.repo.find({relations: ['user', 'report', 'report.category', 'report.createdBy']});
    }

    findNotificationById = async (id: number): Promise<NotificationDAO | null> => {
        return await this.repo.findOne({ where: { id }});
    }

    createNotification = async (notification: NotificationDAO): Promise<NotificationDAO> => {
        const saved = await this.repo.save(notification);
        const newNotification = await this.repo.findOne({
            where: { id: saved.id },
            relations: ['user', 'report', 'report.category', 'report.createdBy']
        });
        return newNotification!;
    }

    updateNotificationSeen = async (notification: NotificationDAO): Promise<void> => {
        await this.repo.update({id: notification.id}, { seen: true });
    }
}

export const notificationRepository = new NotificationRepository();