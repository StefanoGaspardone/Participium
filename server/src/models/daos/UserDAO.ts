import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn,  } from "typeorm";
import { MunicipalityRoleDAO } from "@daos/MunicipalityRoleDAO";
import { IsEmail, IsEnum, IsNotEmpty, IsString, IsUrl, ValidateIf, Validator } from "class-validator";
import { ReportDAO } from "@daos/ReportDAO";

export enum UserType {
    CITIZEN = 'CITIZEN',
    ADMINISTRATOR = 'ADMINISTRATOR',
    OFFICER = 'OFFICER'
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
    image: string;

    @Column({ unique: true, nullable: true, type: 'varchar' })
    @IsString()
    telegramUsername: string;

    @Column({ type: 'varchar' })
    @IsEnum(UserType)
    userType: UserType;
    
    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @ManyToOne(() => MunicipalityRoleDAO, municipalityRole => municipalityRole.users, { nullable: true })
    @JoinColumn({ name: 'municipality_role_id' })
    @ValidateIf(o => o.userType === UserType.OFFICER)
    @IsNotEmpty({ message: 'Municipality role cannot be empty for a municipality officer' })
    municipalityRole: MunicipalityRoleDAO;

    @OneToMany(() => ReportDAO, report => report.createdBy)
    @ValidateIf(o => o.userType === UserType.CITIZEN)
    createdReports: ReportDAO[];

    @OneToMany(() => ReportDAO, report => report.assignedTo)
    @ValidateIf(o => o.userType === UserType.OFFICER)
    assignedReports: ReportDAO[];
}