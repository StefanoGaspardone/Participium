import {Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
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

    @ManyToMany(() => UserDAO, user => user.offices)
    @JoinTable({
        name: 'user_offices',
        joinColumn: { name: 'office_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' }
    })
    users: UserDAO[];


    @OneToMany(() => CategoryDAO, category => category.office)
    categories: CategoryDAO[];
}