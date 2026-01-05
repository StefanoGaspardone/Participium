// filepath: /Users/fede/Desktop/repos/Participium/server/src/services/NotificationService.ts
import { notificationRepository, NotificationRepository } from '@repositories/NotificationRepository';
import { NotificationDAO } from '@daos/NotificationsDAO';
import {createNotificationDTO, NewNotificationDTO, NotificationDTO} from "@dtos/NotificationDTO";
import {userRepository, UserRepository} from "@repositories/UserRepository";
import {BadRequestError} from "@errors/BadRequestError";
import {reportRepository, ReportRepository} from "@repositories/ReportRepository";
import {messageRepository, MessageRepository} from "@repositories/MessageRepository";
import {NotificationType} from '@daos/NotificationsDAO';
import {NewMessageNotificationDTO} from '@dtos/NotificationDTO';

export class NotificationService {

    private readonly notificationRepo: NotificationRepository;
    private readonly userRepo: UserRepository;
    private readonly reportRepo: ReportRepository;
    private readonly messageRepo: MessageRepository;

    constructor() {
        this.notificationRepo = notificationRepository;
        this.userRepo = userRepository;
        this.reportRepo = reportRepository;
        this.messageRepo = messageRepository;
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

        notificationDAO.type = NotificationType.REPORT_STATUS;

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

    createMessageNotification = async (payload: NewMessageNotificationDTO): Promise<NotificationDTO> => {
        const notificationDAO = new NotificationDAO;

        const user = await this.userRepo.findUserById(payload.userId);
        if (!user) {
            throw new BadRequestError("User not found");
        }
        notificationDAO.user = user;

        const report = await this.reportRepo.findReportById(payload.reportId);
        if (!report) {
            throw new BadRequestError("Report not found");
        }
        notificationDAO.report = report;

        const message = await this.messageRepo.findMessageById(payload.messageId);
        if (!message) {
            throw new BadRequestError('Message not found');
        }
        notificationDAO.message = message;

        notificationDAO.type = NotificationType.MESSAGE;

        const newNotification = await this.notificationRepo.createNotification(notificationDAO);
        return createNotificationDTO(newNotification);
    }
}

export const notificationService = new NotificationService();

