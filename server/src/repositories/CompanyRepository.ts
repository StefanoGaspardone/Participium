import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { CompanyDAO } from "@daos/CompanyDAO";

export class CompanyRepository {
    private readonly repo: Repository<CompanyDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(CompanyDAO);
    }

    findAllCompanies = async(): Promise<CompanyDAO[]> => {
        return this.repo.find({ relations: { categories: true } });
    }

    findCompanyById = async(id: number): Promise<CompanyDAO | null> => {
        return this.repo.findOneBy({id});
    }

    createNewCompany = async(company: CompanyDAO): Promise<CompanyDAO> => {
        return this.repo.save(company);
    }    

    doesCompanyExists = async(companyName: string): Promise<boolean> => {
        return this.repo.exists({where: {name: companyName}});
    }
}

export const companyRepository = new CompanyRepository();