import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CategoryDAO } from '@daos/CategoryDAO';
import { ArrayMaxSize, ArrayMinSize, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsString, IsUrl, Max, Min, ValidateIf } from 'class-validator';
import { UserDAO } from '@daos/UserDAO';

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
    @IsString()
    title: string;  

    @Column({ type: 'varchar' })
    @IsString()
    description: string;

    @ManyToOne(() => CategoryDAO, category => category.reports)
    @JoinColumn({ name: 'category_id' })
    category: CategoryDAO;

    @Column('text', { array: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(3)
    @IsUrl({}, { each: true })
    images: string[];

    @Column('decimal', { precision: 10, scale: 8 })
    @IsNumber()
    @Min(-90)
    @Max(90)
    lat: number;

    @Column('decimal', { precision: 10, scale: 8 })
    @IsNumber()
    @Min(-180)
    @Max(180)
    long: number;

    @Column({ type: 'varchar', default: ReportStatus.PendingApproval })
    @IsEnum(ReportStatus)
    status: ReportStatus;

    @Column({ default: false })
    @IsBoolean()
    anonymous: boolean;

    @Column({ type: 'varchar', nullable: true })
    @ValidateIf(o => o.status === ReportStatus.Rejected)
    @IsNotEmpty({ message: 'Rejected description cannot be empty for a rejected report' })
    rejectedDescription: string;

    @ManyToOne(() => UserDAO, user => user.createdReports)
    @JoinColumn({ name: 'created_by_id' })
    createdBy: UserDAO;

    @ManyToOne(() => UserDAO, user => user.assignedReports)
    @JoinColumn({ name: 'assigned_to_id' })
    @ValidateIf(o => [ReportStatus.Assigned, ReportStatus.InProgress, ReportStatus.Resolved, ReportStatus.Rejected, ReportStatus.Suspended].includes(o.status))
    assignedTo: UserDAO;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}