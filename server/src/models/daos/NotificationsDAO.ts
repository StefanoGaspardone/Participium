import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {ReportDAO, ReportStatus} from '@daos/ReportDAO';
import {UserDAO} from "@daos/UserDAO";
import {MessageDAO} from "@daos/MessagesDAO";
import {IsEnum} from "class-validator";

export enum NotificationType { REPORT_STATUS = 'REPORT_STATUS', MESSAGE = 'MESSAGE' }

@Entity({ name: 'notifications' })
export class NotificationDAO {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => UserDAO, user => user.notifications)
    @JoinColumn({ name: 'username' })
    user: UserDAO;

    @ManyToOne(() => ReportDAO, report => report.notifications)
    @JoinColumn({ name: 'report_id' })
    report: ReportDAO;

    @Column({ type: 'varchar', nullable: true})
    previousStatus?: ReportStatus;

    @Column({ type: 'varchar', nullable: true})
    newStatus?: ReportStatus;

    @Column({ type: 'enum', enum: NotificationType, nullable: true })
    @IsEnum(NotificationType)
    type: NotificationType;

    @ManyToOne(() => MessageDAO, { nullable: true })
    @JoinColumn({ name: 'message_id' })
    message?: MessageDAO;

    @Column({ type: 'boolean', default: false })
    seen: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}