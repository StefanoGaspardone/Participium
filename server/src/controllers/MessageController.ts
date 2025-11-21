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
            if(req.body.text === undefined){
                throw new BadRequestError("text is required");
            }else{
                messageData.text = req.body.text;
            }
            if(req.body.reportId === undefined){
                throw new BadRequestError("reportId is required");
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
            res.status(200).json(messages);
        } catch (error) {
            next(error);
        }
    }
}

export const messageController = new MessageController();