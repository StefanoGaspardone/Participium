import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserDAO } from "@daos/UserDAO";
import { CategoryDAO } from "@daos/CategoryDAO";

@Entity({ name: 'municipality_roles' })
export class MunicipalityRoleDAO {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, type: 'varchar' })
    name: string;

    @OneToMany(() => UserDAO, user => user.municipalityRole)
    users: UserDAO[];

    @OneToMany(() => CategoryDAO, category => category.municipalityRole)
    categories: CategoryDAO[];
}