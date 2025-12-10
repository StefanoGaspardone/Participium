import { MessageDAO } from "@daos/MessagesDAO";
import { Repository } from "typeorm";
import { AppDataSource } from "@database";
import { ReportDAO } from "@daos/ReportDAO";

export class MessageRepository {
  private repository: Repository<MessageDAO>;

  constructor() {
    this.repository = AppDataSource.getRepository(MessageDAO);
  }

  /**
   * function to create a message that will be related to a chat
   * @param message: MessageDAO, is the message that has to be stored on the DB
   * @returns the MessageDAO instance now stored on the DB
   */
  create = async (message: MessageDAO): Promise<MessageDAO> => {
    return await this.repository.save(message);
  };

  /**
   * 
   * @param chatId: number, is the identifier of the chat the retrieved messages are related to
   * @returns the MessageDAO[] arra containing ALL the messages related to a chat
   */
  findByChatId = async (chatId: number): Promise<MessageDAO[]> => {

    if (chatId === undefined || chatId === null) {
      throw new Error("findByChatId: chatId is required");
    }
    // use QueryBuilder to avoid potential issues with nested where objects and give clearer errors
    return await this.repository.find({ where: { chat: { id: chatId } }, relations: ["sender", "receiver", "chat", "chat.tosm_user", "chat.second_user", "chat.report", "chat.report.category", "chat.report.createdBy", "chat.report.assignedTo", "chat.report.coAssignedTo", ] });
  };

}

export const messageRepository = new MessageRepository();
