import { ReportDAO, ReportStatus } from "@daos/ReportDAO";
import { CategoryDTO, createCategoryDTO } from "@dtos/CategoryDTO";
import { UserDTO, MapUserDAOtoDTO } from "@dtos/UserDTO";
import {createReportDTO, ReportDTO} from "@dtos/ReportDTO";
import {NotificationDAO} from "@daos/NotificationsDAO";

export interface NotificationDTO {
    id: number;
    previousStatus: ReportStatus;
    newStatus: ReportStatus;
    user: UserDTO;
    report: ReportDTO;
    seen: boolean;
    createdAt: Date;
}

export interface NewNotificationDTO {
    previousStatus: ReportStatus;
    newStatus: ReportStatus;
    userId: number;
    reportId: number;
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
    } as NotificationDTO;
}
