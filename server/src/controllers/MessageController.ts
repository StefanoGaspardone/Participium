import {NextFunction, Request, Response} from 'express';
import {messageService, MessageService} from '@services/MessageService';
import {CreateMessageDTO, MessageDTO} from '@dtos/MessageDTO';
import {AuthRequest} from "@middlewares/authenticationMiddleware";
import {BadRequestError} from "@errors/BadRequestError";

export class MessageController {
    private messageService: MessageService;

    constructor() {
        this.messageService = messageService;
    }

    createMessage = async (req: AuthRequest, res: Response, next: NextFunction) =>{
        try {
            if (!req.token?.user) {
                throw new BadRequestError("Invalid token");
            }

            const messageData = {} as CreateMessageDTO;

            messageData.senderId = req.token.user.id;
            if(req.body.text === undefined || typeof req.body.text !== 'string'){
                throw new BadRequestError("text is required and it must be a string");
            }else{
                messageData.text = req.body.text;
            }
            if(req.body.receiverId === undefined || typeof req.body.receiverId !== 'number'){
                throw new BadRequestError("receiverId is required and it must be a number");
            }else{
                messageData.receiverId = req.body.receiverId;
            }
            if(req.body.reportId === undefined || typeof req.body.reportId !== 'number'){
                throw new BadRequestError("reportId is required and it must be a number");
            }else{
                messageData.reportId = req.body.reportId;
            }

            const message = await this.messageService.createMessage(messageData);
            res.status(201).json(message);
        } catch (error) {
            next(error);
        }
    }

    getMessagesByReportId = async (req: AuthRequest & Request<{ id: string }>, res: Response, next: NextFunction) =>{
        try {
            const { id } = req.params;
            const reportId = parseInt(id, 10);
            if (isNaN(reportId)) {
                throw new BadRequestError("Invalid report ID");
            }
            const messages = await this.messageService.getMessagesByReportId(reportId);
            res.status(200).json({ messages });
        } catch (error) {
            next(error);
        }
    }

    getMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if(!req.token?.user) {
                throw new BadRequestError("Invalid token");
            }

            const userId = req.token.user.id;
            const chats = await this.messageService.getChats(userId!);

            return res.status(200).json({ chats });
        } catch(error) {
            next(error);
        }
    }
}

export const messageController = new MessageController();