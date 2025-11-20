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

    createNotification = async (notification: NotificationDAO): Promise<NotificationDAO> => {
        const saved = await this.repo.save(notification);
        const newNotification = await this.repo.findOne({
            where: { id: saved.id },
            relations: ['user', 'report', 'report.category', 'report.createdBy']
        });
        return newNotification!;
    }
}

export const notificationRepository = new NotificationRepository();