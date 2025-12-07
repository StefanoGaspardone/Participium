import { ChatDAO } from "@daos/ChatsDAO";
import { Repository } from "typeorm";
import { AppDataSource } from "@database";
import { ReportDAO } from "@daos/ReportDAO";

export class ChatRepository {
  private repository: Repository<ChatDAO>;

  constructor() {
    this.repository = AppDataSource.getRepository(ChatDAO);
  }
  /**
   * create a new Chat instance on the DB
   * @param chat is the object corresponding to the new chat desired to be created 
   * @returns the ChatDAO object if the instance is created on the DB
   */
  create = async (chat: ChatDAO): Promise<ChatDAO> => {
    return await this.repository.save(chat);
  };

  /**
   * @function to find the 2 chats related to a report
   * @returns 2 ChatDAO instances in an array ChatDAO[]
   */
  findByReportId = async (report: number): Promise<ChatDAO[]> => {
    return await this.repository
      .createQueryBuilder("chat")
      .leftJoinAndSelect("chat.tosm_user", "tosm_user")
      .leftJoinAndSelect("chat.second_user", "second_user")
      .leftJoinAndSelect("chat.report", "report")
      .leftJoinAndSelect("report.category", "category")
      .leftJoinAndSelect("report.createdBy", "createdBy")
      .leftJoinAndSelect("report.assignedTo", "assignedTo")
      .where("report.id = :reportId", { reportId: report })
      .orderBy("chat.id", "ASC")
      .getMany();
  };

  /**
   * @function to find ALL the chats of a user (as tosm_user or second_user)
   * @param userId = the id of the user to retrieve chat of
   */
  findAllByUserId = async (userId: number): Promise<ChatDAO[]> => {
    return await this.repository
      .createQueryBuilder("chat")
      .leftJoinAndSelect("chat.tosm_user", "tosm_user")
      .leftJoinAndSelect("chat.second_user", "second_user")
      .leftJoinAndSelect("chat.report", "report")
      .leftJoinAndSelect("report.category", "category")
      .leftJoinAndSelect("report.createdBy", "createdBy")
      .leftJoinAndSelect("report.assignedTo", "assignedTo")
      .where("tosm_user.id = :userId OR second_user.id = :userId", { userId })
      .orderBy("chat.id", "ASC")
      .getMany();
  };

  /**
   * 
   * @param chatId: number, the id of the chat you want to retrieve
   * @returns the ChatDAO instance if the chat exists, null otherwise
   */
  findChatById = async (chatId: number): Promise<ChatDAO | null> => {
    return await this.repository.findOne({
      where: { id: chatId }, 
      relations: [
        "tosm_user", 
        "second_user", 
        "report",
        "report.category",
        "report.createdBy",
        "report.assignedTo",
        "report.coAssignedTo"
      ],
    });
  }
}

export const chatRepository = new ChatRepository();
