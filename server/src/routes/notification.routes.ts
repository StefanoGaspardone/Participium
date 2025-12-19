// filepath: /Users/fede/Desktop/repos/Participium/server/src/routes/notification.routes.ts
import { Router } from 'express';
import { notificationController } from '@controllers/NotificationController';
import { authMiddleware } from '@middlewares/authenticationMiddleware';
import {UserType} from "@daos/UserDAO";

const router = Router();

// require authentication to access notifications
router.get('/', notificationController.findAll);
router.post('/', notificationController.createNotification);
router.patch("/seen/:id", authMiddleware([UserType.CITIZEN, UserType.TECHNICAL_STAFF_MEMBER, UserType.EXTERNAL_MAINTAINER]), notificationController.updateNotificationSeen);
router.get("/my", authMiddleware([UserType.CITIZEN, UserType.TECHNICAL_STAFF_MEMBER, UserType.EXTERNAL_MAINTAINER]), notificationController.getMyNotifications);

export const notificationRouter = router;

