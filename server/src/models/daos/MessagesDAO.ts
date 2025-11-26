import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserDAO } from '@daos/UserDAO';
import { ReportDAO } from '@daos/ReportDAO';
import { IsNotEmpty, IsString } from 'class-validator';

@Entity({ name: 'messages' })
export class MessageDAO {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    @IsString()
    @IsNotEmpty()
    text: string;

    @CreateDateColumn({ type: 'timestamptz' })
    sentAt: Date;

    @ManyToOne(() => UserDAO, { nullable: false })
    @JoinColumn({ name: 'sender_id' })
    @IsNotEmpty()
    sender: UserDAO;

    @ManyToOne(() => UserDAO, { nullable: false })
    @JoinColumn({ name: 'receiver_id' })
    @IsNotEmpty()
    receiver: UserDAO;

    @ManyToOne(() => ReportDAO, { nullable: false })
    @JoinColumn({ name: 'report_id' })
    @IsNotEmpty()
    report: ReportDAO;
}
