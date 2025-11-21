import {MessageDAO} from "@daos/MessagesDAO";
import {MapUserDAOtoDTO, UserDTO} from "@dtos/UserDTO";
import {createReportDTO, ReportDTO} from "@dtos/ReportDTO";

export class CreateMessageDTO {
    text: string;
    senderId: number;
    reportId: number;
}

export class MessageDTO {
    id: number;
    text: string;
    sentAt: Date;
    sender: UserDTO;
    receiver: UserDTO;
    report: ReportDTO;
}

export const messageDAOtoDTO = (message: MessageDAO): MessageDTO =>{
    return {
        id: message.id,
        text: message.text,
        sentAt: message.sentAt,
        sender: MapUserDAOtoDTO(message.sender),
        receiver: MapUserDAOtoDTO(message.receiver),
        report: createReportDTO(message.report)
    };
}