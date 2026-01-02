import { NextFunction, Response } from 'express';
import { messageService, MessageService } from '@services/MessageService';
import { CreateMessageDTO } from '@dtos/MessageDTO';
import { AuthRequest } from "@middlewares/authenticationMiddleware";
import { BadRequestError } from "@errors/BadRequestError";

export class MessageController {
    private readonly messageService: MessageService;

    constructor() {
        this.messageService = messageService;
    }

    /**
     * function to send/create a message
     * @param req contains the info of the sender, the receiver, the chat the message is related to and the text
     * (senderId is inside req.token.user.id, receiverId is req.body.receiverId, chatId is req.params.chatId, test is req.body.text)
     * @param res 
     * @param next 
     */
    createMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.token?.user) {
                throw new BadRequestError("Invalid token");
            }
            const messageData = {} as CreateMessageDTO;
            messageData.senderId = req.token.user.id;
            if (req.body.text === undefined || typeof req.body.text !== 'string') {
                throw new BadRequestError("text is required and it must be a string");
            } else {
                messageData.text = req.body.text;
            }
            if (req.body.receiverId === undefined || typeof req.body.receiverId !== 'number') {
                throw new BadRequestError("receiverId is required and it must be a number");
            } else {
                messageData.receiverId = req.body.receiverId;
            }
            if (req.params.chatId === undefined) {
                throw new BadRequestError("chatId must be specified");
            } else {
                const chatIdParam = Number(req.params.chatId);
                if(Number.isNaN(chatIdParam) || chatIdParam < 0) {
                    throw new BadRequestError("chatId must be a number");
                }
                messageData.chatId = chatIdParam;
            }
            const message = await this.messageService.createMessage(messageData);
            res.status(201).json(message);
        } catch (error) {
            next(error);
        }
    }

    /**
     * function to retrieve the messages of a specific chat
     * @param req the id of the chat the messages want to be retrieved are in the params,
     * req.params.chatId
     * @param res 
     * @param next 
     * @returns json containing the array of messages related to the chat
     */
    getChatMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.token?.user) {
                throw new BadRequestError("Invalid token");
            }

            if(req.params.chatId === undefined) {
                throw new BadRequestError('chat id of the chat desired to retrieve must be specified');
            }
            const chatIdParam = Number(req.params.chatId);
            if(Number.isNaN(chatIdParam) || chatIdParam < 0) {
                throw new BadRequestError('The chat id must be a valid number');
            }
            const chats = await this.messageService.getChatMessages(chatIdParam);
            return res.status(200).json({ chats });
        } catch (error) {
            next(error);
        }
    }
}

export const messageController = new MessageController();