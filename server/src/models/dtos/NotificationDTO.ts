import { ReportDAO, ReportStatus } from "@daos/ReportDAO";
import { CategoryDTO, createCategoryDTO } from "@dtos/CategoryDTO";
import { UserDTO, MapUserDAOtoDTO } from "@dtos/UserDTO";
import {createReportDTO, ReportDTO} from "@dtos/ReportDTO";
import {NotificationDAO, NotificationType} from "@daos/NotificationsDAO";
import { MessageDAO } from "@daos/MessagesDAO";

export interface NotificationDTO {
    id: number;
    previousStatus: ReportStatus;
    newStatus: ReportStatus;
    user: UserDTO;
    report: ReportDTO;
    seen: boolean;
    createdAt: Date;
    type?: NotificationType;
    message?: {
        id: number;
        text: string;
        sentAt: Date;
        senderId?: number;
        senderRole?: string;
    } | null;
}

export interface NewNotificationDTO {
    previousStatus: ReportStatus;
    newStatus: ReportStatus;
    userId: number;
    reportId: number;
}
export interface NewMessageNotificationDTO {
    userId: number; // receiver
    reportId: number;
    messageId: number;
}
export const createNotificationDTO = (notification: NotificationDAO): NotificationDTO => {
    return {
        id: notification.id,
        previousStatus: notification.previousStatus,
        newStatus: notification.newStatus,
        user: MapUserDAOtoDTO(notification.user),
        report: createReportDTO(notification.report),
        seen: notification.seen,
        createdAt: new Date(notification.createdAt),
        type: notification.type,
        message: notification.message ? {
            id: notification.message.id,
            text: notification.message.text,
            sentAt: notification.message.sentAt,
            senderId: notification.message.sender?.id,
            senderRole: notification.message.sender?.userType
        } : null,
    } as NotificationDTO;
}
