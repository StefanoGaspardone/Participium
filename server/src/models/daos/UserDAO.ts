import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn,  } from "typeorm";
import { MunicipalityRoleDAO } from "./MunicipalityRoleDAO";
import { IsEnum, IsNotEmpty, ValidateIf, Validator } from "class-validator";
import { ReportDAO } from "./ReportDAO";

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
    firstName: string;

    @Column({ type: 'varchar' })
    lastName: string;

    @Column({ unique: true, type: 'varchar' })
    email: string;

    @Column({ unique: true, type: 'varchar' })
    username: string;

    @Column({ type: 'varchar' })
    passwordHash: string;

    @Column({ nullable: true, type: 'varchar' })
    image: string;

    @Column({ unique: true, nullable: true, type: 'varchar' })
    telegramUsername: string;

    @Column({ type: 'varchar' })
    @IsEnum(UserType)
    userType: UserType;
    
    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @ManyToOne(() => MunicipalityRoleDAO, municipalityRole => municipalityRole.users, { nullable: true })
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