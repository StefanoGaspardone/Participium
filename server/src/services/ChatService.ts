import { chatRepository, ChatRepository } from "@repositories/ChatRepository";
import { userRepository, UserRepository } from "@repositories/UserRepository";
import {
  reportRepository,
  ReportRepository,
} from "@repositories/ReportRepository";
import { ChatDTO, createChatDTO, MapChatDAOtoDTO } from "@dtos/ChatDTO";
import { NotFoundError } from "@errors/NotFoundError";
import { UserType } from "@daos/UserDAO";
import { ChatDAO, ChatType } from "@daos/ChatsDAO";

export class ChatService {
  private readonly chatRepository: ChatRepository;
  private readonly userRepository: UserRepository;
  private readonly reportRepository: ReportRepository;

  constructor() {
    this.chatRepository = chatRepository;
    this.userRepository = userRepository;
    this.reportRepository = reportRepository;
  }

  /**
   * create a new Chat instance on the DB
   * @param createChatDTO is the object corresponding to the new chat desired to be created,
   * with the necessary infos, 1st and 2nd user + report attached to
   * @returns the ChatDTO object corresponding the instance is created on the DB
   */
  async createChat(createChatDTO: createChatDTO): Promise<ChatDTO> {
    const tosm_user = await this.userRepository.findUserById(
      createChatDTO.tosm_user_id
    );
    if (!tosm_user) {
      throw new NotFoundError("TOSM specified not found");
    }
    const second_user = await this.userRepository.findUserById(
      createChatDTO.second_user_id
    );
    if (!second_user) {
      throw new NotFoundError("specified user not found");
    }
    const second_user_type: UserType = second_user.userType;
    const report = await this.reportRepository.findReportById(
      createChatDTO.report_id
    );
    if (!report) {
      throw new NotFoundError("specified report not found");
    }

    const chat = {} as ChatDAO;
    chat.second_user = second_user;
    chat.tosm_user = tosm_user;
    if (second_user_type === UserType.CITIZEN)
      chat.chatType = ChatType.CITIZEN_TOSM;
    else if (second_user_type === UserType.EXTERNAL_MAINTAINER)
      chat.chatType = ChatType.EXT_TOSM;
    else {
      throw new Error("chatType could not be recognized");
    }
    chat.report = report;
    const savedChat = await this.chatRepository.create(chat);
    return MapChatDAOtoDTO(savedChat);
  }

  /**
   * @function to find ALL the chats of a user (as tosm_user or second_user)
   * @param userId = the id of the user to retrieve chat of
   * @returns the array with all the chats the user appears in
   */
  async findAllByUserId(userId: number): Promise<ChatDTO[]> {
    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError("specified user not found");
    }
    const chats = await this.chatRepository.findAllByUserId(user.id);
    return chats.map((c) => MapChatDAOtoDTO(c));
  }

  /**
   * @function to find the 2 chats related to a report
   * @returns 2 ChatDAO instances in an array ChatDAO[]
   */
  async findByReportId(reportId: number): Promise<ChatDTO[]> {
    const report = await this.reportRepository.findReportById(reportId);
    if (!report) {
      throw new NotFoundError("Specified report was not found");
    }
    const chats = await this.chatRepository.findByReportId(report.id);
    return chats.map((c) => MapChatDAOtoDTO(c));
  }

  /**
   * function to find the Chat based on the chat id
   * @param chatId: number, the identifier of the chat you want to retrieve
   * @returns the ChatDTo instance of the searched Chat
   */
  async findChatById(chatId: number): Promise<ChatDTO> {
    const chat = await this.chatRepository.findChatById(chatId);
    if (chat) {
      return MapChatDAOtoDTO(chat);
    } else {
      throw new NotFoundError("Specified chat was not found");
    }
  }
}

export const chatService = new ChatService();