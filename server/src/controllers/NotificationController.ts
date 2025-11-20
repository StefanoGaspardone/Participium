// filepath: /Users/fede/Desktop/repos/Participium/server/src/controllers/NotificationController.ts
import { NextFunction, Request, Response } from 'express';
import { notificationService, NotificationService } from '@services/NotificationService';

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
}

export const notificationController = new NotificationController();

