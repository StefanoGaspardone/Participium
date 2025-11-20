// filepath: /Users/fede/Desktop/repos/Participium/server/src/controllers/NotificationController.ts
import { NextFunction, Request, Response } from 'express';
import { notificationService, NotificationService } from '@services/NotificationService';
import {NewUserDTO} from "@dtos/UserDTO";
import {NewNotificationDTO, NotificationDTO} from "@dtos/NotificationDTO";
import {BadRequestError} from "@errors/BadRequestError";
import {UserType} from "@daos/UserDAO";
import {ReportStatus} from "@daos/ReportDAO";

export class NotificationController {
    private notificationService: NotificationService;

    constructor() {
        this.notificationService = notificationService;
    }

    findAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const notifications = await this.notificationService.findAllNotifications();
            res.status(200).json({ notifications });
        } catch(error) {
            next(error);
        }
    }

    createNotification = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const notificationData: NewNotificationDTO = {} as NewNotificationDTO;

            if (req.body.reportId === undefined){
                throw new BadRequestError("reportId is required");
            }else {
                notificationData.reportId = req.body.reportId;
            }
            if (req.body.previousStatus === undefined){
                throw new BadRequestError("previousStatus is required");
            }else{
                notificationData.previousStatus = req.body.previousStatus;
            }
            if (req.body.newStatus === undefined){
                throw new BadRequestError("newStatus is required");
            }else{
                notificationData.newStatus = req.body.newStatus;
            }
            if (req.body.userId === undefined){
                throw new BadRequestError("userId is required");
            }else{
                notificationData.userId = req.body.userId;
            }
            if (!Object.values(ReportStatus).includes(req.body.previousStatus)) {
                throw new BadRequestError("previous report status type is invalid");
            }
            if (!Object.values(ReportStatus).includes(req.body.newStatus)) {
                throw new BadRequestError("new report status type is invalid");
            }

            const newNotification = await this.notificationService.createNotification(notificationData);
            res.status(201).json(newNotification);
        } catch(error) {
            next(error);
        }
    }

    updateNotificationSeen = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const notificationId = parseInt(id, 10);
            if (isNaN(notificationId)) {
                throw new BadRequestError("Invalid notification ID");
            }
            await this.notificationService.updateNotificationSeen(notificationId);
            res.status(200).json({ message: "Notification marked as seen" });
        } catch(error) {
            next(error);
        }
    }
}

export const notificationController = new NotificationController();

