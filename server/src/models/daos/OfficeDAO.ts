import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserDAO } from '@daos/UserDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import { IsString } from 'class-validator';

@Entity({ name: 'office_roles' })
export class OfficeDAO {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, type: 'varchar' })
    @IsString()
    name: string;

    @OneToMany(() => UserDAO, user => user.office)
    users: UserDAO[];

    @OneToMany(() => CategoryDAO, category => category.office)
    categories: CategoryDAO[];
}