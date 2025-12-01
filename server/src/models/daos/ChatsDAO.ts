import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from "class-validator";
import { UserDAO } from "@daos/UserDAO";
import { ReportDAO } from "@daos/ReportDAO";

/**
 * @enum for differentiating the type of chat
 * CITIZEN_TOSM = 'user_tosm' => the chat is between a user and a technical office staff member
 * EXT_TOSM = 'ext_tosm'=> the chat is between an external maintainer and a technical office staff member
 */
export enum ChatType {
  CITIZEN_TOSM = "citizen_tosm",
  EXT_TOSM = "ext_tosm",
}

/**
 * @class it is the class related to the Chat table on the DB
 * @field id -> the identifier of the chat NOT NULLABLE
 * @field chatType -> indicates the type of chat (if citizen-tosm OR ext_main-tosm) NOT NULLABLE
 * @field report -> the field containing the id of the report it is associated NOT NULLABLE
 * @field tosm_user -> indicates the tosm related to the chat
 * @field second_user -> indicates the citizen OR the ext_maint related to the chat
 * @field report -> indicates the report the chat is related to
 */
@Entity({ name: "chats" })
export class ChatDAO {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false })
  @IsEnum(ChatType)
  chatType: ChatType;

  @JoinColumn({ name: "tosm_user" })
  @ManyToOne(() => UserDAO, { nullable: false })
  @IsNotEmpty()
  @ValidateIf((c) => c.tosm_user.userType === 'TECHNICAL_STAFF_MEMBER' && c.tosm_user.office !== null )
  tosm_user: UserDAO;

  @JoinColumn({ name: "second_user" })
  @ManyToOne(() => UserDAO, { nullable: false })
  @IsNotEmpty()
  @ValidateIf((c) => c.tosm_user.userType === 'CITIZEN' || c.tosm_user.userType === 'EXTERNAL_MAINTAINER' )
  second_user: UserDAO;

  @JoinColumn({ name: "report_id" })
  @ManyToOne(() => ReportDAO, { nullable: false })
  @IsNotEmpty()
  report: ReportDAO;
}
