import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CategoryDAO } from './CategoryDAO';
import { ArrayMaxSize, ArrayMinSize, IsEnum, ValidateIf } from "class-validator";
import { UserDAO } from "./UserDAO";

export enum ReportStatus {
    PendingApproval = 'PendingApproval', 
    Assigned = 'Assigned', 
    InProgress = 'InProgress',
    Suspended = 'Suspended',
    Rejected = 'Rejected',
    Resolved = 'Resolved'
}

@Entity({ name: 'reports' })
export class ReportDAO {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar' })
    title: string;  

    @Column({ type: 'varchar' })
    description: string;

    @ManyToOne(() => CategoryDAO, category => category.reports)
    category: CategoryDAO;

    @Column('text', { array: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(3)
    images: string[];

    @Column({ type: 'varchar', default: ReportStatus.PendingApproval })
    @IsEnum(ReportStatus)
    status: ReportStatus;

    @Column({ default: false })
    anonymous: boolean;

    @Column({ type: 'varchar', nullable: true })
    @ValidateIf(o => o.status === ReportStatus.Rejected)
    rejectedDescription: string;

    @ManyToOne(() => UserDAO, user => user.createdReports)
    createdBy: UserDAO;

    @ManyToOne(() => UserDAO, user => user.assignedReports)
    assignedTo: UserDAO;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}