import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ReportDAO } from "@daos/ReportDAO";
import { OfficeDAO } from "@daos/OfficeDAO";
import { IsNotEmpty, IsString } from "class-validator";
import { CategoryDAO } from "@daos/CategoryDAO";
import { UserDAO } from "./UserDAO";

@Entity({ name: "companies" })
export class CompanyDAO {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", nullable: false })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ManyToMany(() => CategoryDAO, (category) => category.companies, { cascade: false })
  @JoinTable({ name: "company_categories" })
  categories: CategoryDAO[];

  @OneToMany(() => UserDAO, (user) => user.company)
  maintainers: UserDAO[];
}
