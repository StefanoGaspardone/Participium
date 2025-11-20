import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {ReportDAO, ReportStatus} from '@daos/ReportDAO';
import {UserDAO} from "@daos/UserDAO";
import {IsEnum} from "class-validator";

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

    @Column({ type: 'varchar'})
    previousStatus: ReportStatus;

    @Column({ type: 'varchar'})
    newStatus: ReportStatus;

    @Column({ type: 'boolean', default: false })
    seen: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}