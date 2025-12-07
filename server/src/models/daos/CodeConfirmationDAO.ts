import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import { Column, Entity, OneToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { UserDAO } from '@daos/UserDAO';

@Entity('code_confirmations')
export class CodeConfirmationDAO {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @Column({ type: 'timestamptz' })
    @IsDate()
    expirationDate: Date;

    @OneToOne(() => UserDAO, user => user.codeConfirmation)
    @JoinColumn({ name: 'user_id' })
    user: UserDAO;
}