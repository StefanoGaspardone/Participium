import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CategoryDAO } from '@daos/CategoryDAO';
import { ArrayMaxSize, ArrayMinSize, IsEnum, ValidateIf } from "class-validator";
import { UserDAO } from "@daos/UserDAO";

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
    @JoinColumn({ name: 'category_id' })
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
    @JoinColumn({ name: 'created_by_id' })
    createdBy: UserDAO;

    @ManyToOne(() => UserDAO, user => user.assignedReports)
    @JoinColumn({ name: 'assigned_to_id' })
    assignedTo: UserDAO;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}