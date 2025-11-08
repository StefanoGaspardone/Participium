import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserDAO } from '@daos/UserDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import { IsString } from 'class-validator';

@Entity({ name: 'office_roles' })
export class OfficeRoleDAO {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, type: 'varchar' })
    @IsString()
    name: string;

    @OneToMany(() => UserDAO, user => user.officeRole)
    users: UserDAO[];

    @OneToMany(() => CategoryDAO, category => category.municipalityRole)
    categories: CategoryDAO[];
}