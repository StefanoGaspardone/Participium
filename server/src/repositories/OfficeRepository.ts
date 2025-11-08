import {Repository} from "typeorm";
import {AppDataSource} from "@database";
import {OfficeRoleDAO} from "@daos/OfficeRoleDAO";

export class OfficeRoleRepository {

    private repo: Repository<OfficeRoleDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(OfficeRoleDAO);
    }

    findRoleById = async (id: number): Promise<OfficeRoleDAO | null> => {
        return this.repo.findOneBy({ id });
    }

    findAllRoles = async (): Promise<OfficeRoleDAO[]> => {
        return this.repo.find({relations: ['categories']});  // add 'users' relation if needed, in case remember to update OfficeRoleDTO
    }
}

export const municipalityRoleRepository = new OfficeRoleRepository();
