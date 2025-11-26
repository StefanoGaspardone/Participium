import { Router } from 'express';
import {messageController} from '@controllers/MessageController';
import {authMiddleware} from "@middlewares/authenticationMiddleware";
import {UserType} from "@daos/UserDAO";

const router = Router();

router.post('/', authMiddleware([UserType.CITIZEN, UserType.TECHNICAL_STAFF_MEMBER]), messageController.createMessage);
router.get('/', authMiddleware([UserType.CITIZEN, UserType.TECHNICAL_STAFF_MEMBER]), messageController.getMessages);
router.get('/report/:id', authMiddleware([UserType.CITIZEN, UserType.TECHNICAL_STAFF_MEMBER]), messageController.getMessagesByReportId);

export const messageRouter = router;