// filepath: /Users/fede/Desktop/repos/Participium/server/src/services/NotificationService.ts
import { notificationRepository, NotificationRepository } from '@repositories/NotificationRepository';
import { NotificationDAO } from '@daos/NotificationsDAO';
import {createNotificationDTO, NewNotificationDTO, NotificationDTO} from "@dtos/NotificationDTO";
import {userRepository, UserRepository} from "@repositories/UserRepository";
import {BadRequestError} from "@errors/BadRequestError";
import {reportRepository, ReportRepository} from "@repositories/ReportRepository";

export class NotificationService {

    private notificationRepo: NotificationRepository;
    private userRepo: UserRepository;
    private reportRepo: ReportRepository;

    constructor() {
        this.notificationRepo = notificationRepository;
        this.userRepo = userRepository;
        this.reportRepo = reportRepository;
    }

    findAllNotifications = async (): Promise<NotificationDTO[]> => {
        const notifications = await this.notificationRepo.findAllNotifications();
        return notifications.map(createNotificationDTO);
    }

    createNotification = async (notification: NewNotificationDTO): Promise<NotificationDTO> => {
        const notificationDAO = new NotificationDAO;
        notificationDAO.previousStatus = notification.previousStatus;
        notificationDAO.newStatus = notification.newStatus;

        const user = await this.userRepo.findUserById(notification.userId);
        if (!user) {
            throw new BadRequestError("User not found");
        }
        notificationDAO.user = user;

        const report = await this.reportRepo.findReportById(notification.reportId);
        if (!report) {
            throw new BadRequestError("Report not found");
        }
        notificationDAO.report = report;

        const newNotification = await this.notificationRepo.createNotification(notificationDAO);
        return createNotificationDTO(newNotification);
    }

    updateNotificationSeen = async (id: number): Promise<void> => {
        const notification = await this.notificationRepo.findNotificationById(id);
        if (!notification) {
            throw new BadRequestError("Notification not found");
        }
        await this.notificationRepo.updateNotificationSeen(notification);
    }

    findMyNotifications = async (userId: number): Promise<NotificationDTO[]> => {
        const user = await this.userRepo.findUserById(userId);
        if (!user) {
            throw new BadRequestError("User not found");
        }

        const myNotifications = await this.notificationRepo.findMyNotifications(user);
        return myNotifications.map(createNotificationDTO);
    }
}

export const notificationService = new NotificationService();

