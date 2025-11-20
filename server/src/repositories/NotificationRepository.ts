import {Repository} from "typeorm";
import {NotificationDAO} from "@daos/Notifications";
import {AppDataSource} from "@database";
import {CategoryDAO} from "@daos/CategoryDAO";


export class NotificationRepository {

    private repo: Repository<NotificationDAO>

    constructor() {
        this.repo = AppDataSource.getRepository(NotificationDAO);
    }

    findAllNotifications = async (): Promise<NotificationDAO[]> => {
        return this.repo.find({relations: ['user', 'report', 'report.category', 'report.createdBy']});
    }
}

export const notificationRepository = new NotificationRepository();