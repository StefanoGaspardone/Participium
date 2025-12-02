import { MessageDAO } from "@daos/MessagesDAO";
import { MapUserDAOtoDTO, UserDTO } from "@dtos/UserDTO";
import { createReportDTO, ReportDTO } from "@dtos/ReportDTO";
import { MapChatDAOtoDTO } from "./ChatDTO";
import { ChatDTO } from "./ChatDTO";
import { UserDAO } from "@daos/UserDAO";
import { ChatDAO } from "@daos/ChatsDAO";

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

export class MessageDTOforChats {
    id: number;
    text: string;
    sentAt: Date;
    sender: number;
    receiver: number;
    chat: number;
}

export const messageDAOtoDTO = (message: MessageDAO): MessageDTO => {
    const dto = {
        id: message.id,
        text: message.text,
        sentAt: message.sentAt,
        sender: MapUserDAOtoDTO(message.sender as UserDAO),
        receiver: MapUserDAOtoDTO(message.receiver as UserDAO),
        chat: MapChatDAOtoDTO(message.chat as ChatDAO)
    };
    return dto;
}

export const messageDAOtoDTOforChats = (message: MessageDAO): MessageDTOforChats => {
    const dto = {
         id: message.id,
        text: message.text,
        sentAt: message.sentAt,
        sender: message.sender.id,
        receiver: message.receiver.id,
        chat: message.chat.id
    };
    return dto;
}