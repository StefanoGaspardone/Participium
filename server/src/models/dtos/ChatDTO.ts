import { ChatDAO, ChatType } from "@daos/ChatsDAO";
import { MapUserDAOtoDTO, UserDTO } from "./UserDTO";
import { createReportDTO, ReportDTO } from "./ReportDTO";

export interface ChatDTO {
    id: number,
    chatType: ChatType,
    tosm_user: UserDTO,
    second_user: UserDTO,
    report: ReportDTO
}

export interface createChatDTO {
    tosm_user_id: number,
    second_user_id: number,
    report_id: number,
}

export function MapChatDAOtoDTO(dao: ChatDAO): ChatDTO {
    const dto : ChatDTO = {
        id: dao.id,
        chatType: dao.chatType,
        tosm_user: MapUserDAOtoDTO(dao.tosm_user),
        second_user: MapUserDAOtoDTO(dao.second_user),
        report: createReportDTO(dao.report)
    };
    return dto;
}