import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ReportDAO } from "@daos/ReportDAO";
import { MunicipalityRoleDAO } from "@daos/MunicipalityRoleDAO";
import { IsString } from "class-validator";

@Entity({ name: 'categories' })
export class CategoryDAO {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, type: 'varchar' })
    @IsString()
    name: string;

    @OneToMany(() => ReportDAO, report => report.category)
    reports: ReportDAO[];

    @ManyToOne(() => MunicipalityRoleDAO, municipalityRole => municipalityRole.categories)
    @JoinColumn({ name: 'municipality_role_id' })
    municipalityRole: MunicipalityRoleDAO;
}