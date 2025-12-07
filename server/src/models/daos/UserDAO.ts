import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, } from 'typeorm';
import { OfficeDAO } from '@daos/OfficeDAO';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsString, IsUrl, ValidateIf, Validator } from 'class-validator';
import { ReportDAO } from '@daos/ReportDAO';
import { NotificationDAO } from "@daos/NotificationsDAO";
import { CodeConfirmationDAO } from '@daos/CodeConfirmationDAO';
import { CompanyDAO } from "@daos/CompanyDAO";

export enum UserType {
  CITIZEN = "CITIZEN",
  ADMINISTRATOR = "ADMINISTRATOR",
  PUBLIC_RELATIONS_OFFICER = "PUBLIC_RELATIONS_OFFICER",
  MUNICIPAL_ADMINISTRATOR = "MUNICIPAL_ADMINISTRATOR",
  TECHNICAL_STAFF_MEMBER = "TECHNICAL_STAFF_MEMBER",
  EXTERNAL_MAINTAINER = "EXTERNAL_MAINTAINER",
}

@Entity({ name: "users" })
export class UserDAO {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar" })
  @IsString()
  firstName: string;

  @Column({ type: "varchar" })
  @IsString()
  lastName: string;

  @Column({ unique: true, type: "varchar" })
  @IsEmail()
  email: string;

  @Column({ unique: true, type: "varchar" })
  @IsString()
  username: string;

  @Column({ type: "varchar" })
  passwordHash: string;

  @Column({ nullable: true, type: "varchar" })
  @IsUrl()
  image: string | undefined;

  @Column({ unique: true, nullable: true, type: "varchar" })
  @IsString()
  telegramUsername: string | undefined;

  @Column({ type: 'varchar' })
  @IsEnum(UserType)
  userType: UserType;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: "boolean", default: false })
  emailNotificationsEnabled: boolean;

  @ManyToOne(() => OfficeDAO, (office) => office.users, { nullable: true })
  @JoinColumn({ name: "office_id" })
  @ValidateIf((o) => o.userType === UserType.TECHNICAL_STAFF_MEMBER)
  @IsNotEmpty({
    message: "Office cannot be empty for a technical staff member",
  })
  office: OfficeDAO;

  @OneToMany(() => ReportDAO, (report) => report.createdBy)
  @ValidateIf((o) => o.userType === UserType.CITIZEN)
  createdReports: ReportDAO[];

  @OneToMany(() => NotificationDAO, notification => notification.user)
  notifications: NotificationDAO[];

  @OneToOne(() => CodeConfirmationDAO, code => code.user)
  codeConfirmation: CodeConfirmationDAO;

  @OneToMany(() => ReportDAO, (report) => report.assignedTo)
  @ValidateIf((o) => o.userType === UserType.TECHNICAL_STAFF_MEMBER)
  assignedReports: ReportDAO[];

  @ManyToOne(() => CompanyDAO, (company) => company.maintainers)
  @ValidateIf((o) => o.userType === UserType.EXTERNAL_MAINTAINER)
  @IsNotEmpty({ message: "Company cannot be empty for an external maintainer" })
  @JoinColumn({ name: "company_id" })
  company: CompanyDAO;

  @OneToMany(() => ReportDAO, (report) => report.coAssignedTo)
  coAssignedReports: ReportDAO[];

  /* NO relation pointing to the chats of the user yet, better to extract that information from chat table */
}
