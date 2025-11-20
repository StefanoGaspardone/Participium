// filepath: /Users/fede/Desktop/repos/Participium/server/src/services/NotificationService.ts
import { notificationRepository, NotificationRepository } from '@repositories/NotificationRepository';
import { NotificationDAO } from '@daos/Notifications';
import {createNotificationDTO, NotificationDTO} from "@dtos/NotificationDTO";

export class NotificationService {

    private notificationRepo: NotificationRepository;

    constructor() {
        this.notificationRepo = notificationRepository;
    }

    findAllNotifications = async (): Promise<NotificationDTO[]> => {
        const notifications = await this.notificationRepo.findAllNotifications();
        console.log(notifications[0]);
        return notifications.map(createNotificationDTO);
    }
}

export const notificationService = new NotificationService();

