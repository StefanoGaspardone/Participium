import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { UserDAO, UserType } from "@daos/UserDAO";
import { CategoryDAO } from "@daos/CategoryDAO";
import { CompanyDAO } from "@daos/CompanyDAO";

export class CompanyRepository {
    private repo: Repository<CompanyDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(CompanyDAO);
    }

    findAllCompanies = async(): Promise<CompanyDAO[]> => {
        return this.repo.find();
    }

    createNewCompany = async(company: CompanyDAO): Promise<CompanyDAO> => {
        return this.repo.save(company);
    }    

    doesCompanyExists = async(companyName: string): Promise<boolean> => {
        return this.repo.exists({where: {name: companyName}});
    }
}

export const companyRepository = new CompanyRepository();