import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn,  } from 'typeorm';
import { OfficeDAO } from '@daos/OfficeDAO';
import { IsEmail, IsEnum, IsNotEmpty, IsString, IsUrl, ValidateIf, Validator } from 'class-validator';
import { ReportDAO } from '@daos/ReportDAO';

export enum UserType {
    CITIZEN = 'CITIZEN',
    ADMINISTRATOR = 'ADMINISTRATOR',
    PUBLIC_RELATION_OFFICER = 'PUBLIC_RELATION_OFFICER',
    MUNICIPAL_ADMINISTRATOR = 'MUNICIPAL_ADMINISTRATOR',
    TECHNICAL_STAFF_MEMBER = 'TECHNICAL_STAFF_MEMBER',
}

@Entity({ name: 'users' })
export class UserDAO {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar' })
    @IsString()
    firstName: string;

    @Column({ type: 'varchar' })
    @IsString()
    lastName: string;

    @Column({ unique: true, type: 'varchar' })
    @IsEmail()
    email: string;

    @Column({ unique: true, type: 'varchar' })
    @IsString()
    username: string;

    @Column({ type: 'varchar' })
    passwordHash: string;

    @Column({ nullable: true, type: 'varchar' })
    @IsUrl()
    image: string | undefined;

    @Column({ unique: true, nullable: true, type: 'varchar' })
    @IsString()
    telegramUsername: string | undefined;

    @Column({ type: 'varchar' })
    @IsEnum(UserType)
    userType: UserType;
    
    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @ManyToOne(() => OfficeDAO, office => office.users, { nullable: true })
    @JoinColumn({ name: 'office_id' })
    @ValidateIf(o => o.userType === UserType.TECHNICAL_STAFF_MEMBER)
    @IsNotEmpty({ message: 'Office cannot be empty for a technical staff member' })
    office: OfficeDAO;

    @OneToMany(() => ReportDAO, report => report.createdBy)
    @ValidateIf(o => o.userType === UserType.CITIZEN)
    createdReports: ReportDAO[];

    @OneToMany(() => ReportDAO, report => report.assignedTo)
    @ValidateIf(o => o.userType === UserType.TECHNICAL_STAFF_MEMBER)
    assignedReports: ReportDAO[];
}