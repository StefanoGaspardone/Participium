// filepath: /Users/fede/Desktop/repos/Participium/server/src/routes/notification.routes.ts
import { Router } from 'express';
import { notificationController } from '@controllers/NotificationController';
import { authMiddleware } from '@middlewares/authenticationMiddleware';

const router = Router();

// require authentication to access notifications
router.get('/', notificationController.findAll); //TODO add citizen auth middleware?

export const notificationRouter = router;

