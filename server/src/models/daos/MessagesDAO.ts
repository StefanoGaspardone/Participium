import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserDAO } from '@daos/UserDAO';
import { ReportDAO } from '@daos/ReportDAO';
import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { ChatDAO } from './ChatsDAO';

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
    @ValidateIf((msg) => msg.sender.id === msg.chat.tosm_user.id || msg.sender.id === msg.chat.second_user.id )
    sender: UserDAO;

    @ManyToOne(() => UserDAO, { nullable: false })
    @JoinColumn({ name: 'receiver_id' })
    @IsNotEmpty()
    @ValidateIf((msg) => msg.receiver.id === msg.chat.tosm_user.id || msg.receiver.id === msg.chat.second_user.id )
    receiver: UserDAO;

    @ManyToOne(() => ChatDAO, { nullable: false })
    @JoinColumn({ name: 'chat_id' })
    @IsNotEmpty()
    chat: ChatDAO;
}
