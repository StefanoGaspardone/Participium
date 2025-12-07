import { Router } from 'express';
import { chatController, ChatController } from '@controllers/ChatController';
import { authMiddleware } from '@middlewares/authenticationMiddleware';
import { UserType } from '@daos/UserDAO';
import { messageController } from '@controllers/MessageController';

const router = Router();
// in api/api.ts : 
// createChat()
router.post('/', authMiddleware([UserType.CITIZEN, UserType.EXTERNAL_MAINTAINER, UserType.TECHNICAL_STAFF_MEMBER]), chatController.createChat);

// in api/api.ts : 
// getUserChats()
router.get('/', authMiddleware([UserType.CITIZEN, UserType.EXTERNAL_MAINTAINER, UserType.TECHNICAL_STAFF_MEMBER]), chatController.findUserChats);

// in api/api.ts : 
router.get('/report/:reportId', authMiddleware([UserType.CITIZEN, UserType.EXTERNAL_MAINTAINER, UserType.TECHNICAL_STAFF_MEMBER]), chatController.findReportChats);

// in api/api.ts :
router.get('/:chatId', authMiddleware([UserType.CITIZEN, UserType.EXTERNAL_MAINTAINER, UserType.TECHNICAL_STAFF_MEMBER]), chatController.findChat);

// in api/api.ts :
// sendMessage(chatId: number, payload: SendMessage)         
//          SendMessage = { receiverId: number, text: string }
router.post('/:chatId/newMessage', authMiddleware([UserType.CITIZEN, UserType.EXTERNAL_MAINTAINER, UserType.TECHNICAL_STAFF_MEMBER]), messageController.createMessage);

// in api/api.ts : 
// getChatMessages(chatId: number)
router.get('/:chatId/messages', authMiddleware([UserType.CITIZEN, UserType.EXTERNAL_MAINTAINER, UserType.TECHNICAL_STAFF_MEMBER]), messageController.getChatMessages);

export const chatRouter = router;