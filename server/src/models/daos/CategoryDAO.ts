import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ReportDAO } from '@daos/ReportDAO';
import { OfficeDAO } from '@daos/OfficeDAO';
import { IsString } from 'class-validator';

@Entity({ name: 'categories' })
export class CategoryDAO {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, type: 'varchar' })
    @IsString()
    name: string;

    @OneToMany(() => ReportDAO, report => report.category)
    reports: ReportDAO[];

    @ManyToOne(() => OfficeDAO, office => office.categories)
    @JoinColumn({ name: 'office_id' })
    office: OfficeDAO;
}