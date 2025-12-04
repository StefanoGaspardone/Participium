import { chatService, ChatService } from "@services/ChatService";
import { AuthRequest } from "@middlewares/authenticationMiddleware";
import { BadRequestError } from "@errors/BadRequestError";
import { NextFunction, Request, Response } from "express";
import { createChatDTO } from "@dtos/ChatDTO";
import { UserType } from "@daos/UserDAO";

export class ChatController {
    private chatService: ChatService;

    constructor() {
        this.chatService = chatService;
    }

    /**
     * controller function to create a new Chat, it is called whenever a citizen/tosm/external_maintainer
     * wants to start the chat with "the other part" for a report.
     * @param req req.body has to contain the id related to the "other part" of the chat 
     * AND the id of the report related to (req.body.secondUserId !== undefined && req.body.reportId !== undefined)
     * @param res 
     * @param next 
     */
    createChat = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.token?.user) {
                throw new BadRequestError("Invalid token");
            }
            if (req.body.secondUserId === undefined) {
                throw new BadRequestError("id of the other chat user must be specified to create a chat");
            }
            if (req.body.reportId === undefined) {
                throw new BadRequestError("id of the report the chat is attached to must be specified to create a chat");
            }
            const chatData = {} as createChatDTO;
            if (req.token?.user.userType === UserType.TECHNICAL_STAFF_MEMBER) {
                // if the creator of the chat is the TOSM
                chatData.tosm_user_id = req.token?.user.id;
                chatData.second_user_id = req.body.secondUserId;
            } else if (req.token?.user.userType === UserType.CITIZEN || req.token?.user.userType === UserType.EXTERNAL_MAINTAINER) {
                // if the creator is NOT the TOSM (it has to be a Citizen or Ext Maintainer)
                chatData.second_user_id = req.token?.user.id;
                chatData.tosm_user_id = req.body.secondUserId;
            }
            chatData.report_id = req.body.reportId;
            const chat = await this.chatService.createChat(chatData);
            return res.status(201).json(chat);
        } catch (error) {
            next(error);
        }
    };

    /**
     * controller function to find all the chats of the currently logged user
     * @param req 
     * @param res 
     * @param next 
     */
    findUserChats = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.token?.user) {
                throw new BadRequestError("Invalid token");
            }
            const chats = await this.chatService.findAllByUserId(req.token.user.id);
            return res.status(200).json(chats);
        } catch (error) {
            next(error);
        }
    };

    /**
     * controller function to find the chats related to a report
     * @param req req.body has to contain the reportId of the report you want to 
     * retrieve the chats of
     * @param res 
     * @param next 
     */
    findReportChats = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.token?.user) {
                throw new BadRequestError("Invalid token");
            }
            if (req.params.reportId === undefined) {
                throw new BadRequestError('Report Id of the report the chats you want to retrieve are attached to must be specified');
            }
            const reportIdParam = Number(req.params.reportId);
            if(Number.isNaN(reportIdParam) || reportIdParam < 0) {
                throw new BadRequestError('Report Id of the report the chats you want to retrieve are attached to must be a valid number');
            }
            const chats = await this.chatService.findByReportId(reportIdParam);
            return res.status(200).json(chats);
        } catch (error) {
            next(error);
        }
    };

    /**
     * function to retrieve a specific chat, based on its identifier
     * @param req req.body has to contain the chatId of the desired chat we want to retrieve
     * (req.body.chatId !== undefined)
     * @param res 
     * @param next 
     */
    findChat = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.token?.user) {
                throw new BadRequestError("Invalid token");
            }
            if (req.params.chatId === undefined) {
                throw new BadRequestError('Chat Id of the chat you want to retrieve must be specified');
            }
            const chatIdParam = Number(req.params.chatId);
            if(Number.isNaN(chatIdParam) || chatIdParam < 0) {
                throw new BadRequestError('Chat Id of the chat you want to retrieve must be a valid number');
            }
            const chat = await this.chatService.findChatById(chatIdParam);
            return res.status(200).json(chat);
        } catch (error) {
            next(error);
        }
    };
}

export const chatController = new ChatController();