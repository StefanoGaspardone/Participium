import {MessageDAO} from "@daos/MessagesDAO";
import {MapUserDAOtoDTO, UserDTO} from "@dtos/UserDTO";
import {createReportDTO, ReportDTO} from "@dtos/ReportDTO";
import { MapChatDAOtoDTO } from "./ChatDTO";
import { ChatDTO } from "./ChatDTO";

export class CreateMessageDTO {
    text: string;
    senderId: number;
    receiverId: number;
    chatId: number;
}

export class MessageDTO {
    id: number;
    text: string;
    sentAt: Date;
    sender: UserDTO;
    receiver: UserDTO;
    chat: ChatDTO;
}

export const messageDAOtoDTO = (message: MessageDAO): MessageDTO =>{
    const dto = {
        id: message.id,
        text: message.text,
        sentAt: message.sentAt,
        sender: MapUserDAOtoDTO(message.sender),
        receiver: MapUserDAOtoDTO(message.receiver),
        chat: MapChatDAOtoDTO(message.chat)
    };
    return dto;
}