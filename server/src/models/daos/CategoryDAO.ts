import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ReportDAO } from "@daos/ReportDAO";
import { MunicipalityRoleDAO } from "@daos/MunicipalityRoleDAO";

@Entity({ name: 'categories' })
export class CategoryDAO {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, type: 'varchar' })
    name: string;

    @OneToMany(() => ReportDAO, report => report.category)
    reports: ReportDAO[];

    @ManyToOne(() => MunicipalityRoleDAO, municipalityRole => municipalityRole.categories)
    municipalityRole: MunicipalityRoleDAO;
}