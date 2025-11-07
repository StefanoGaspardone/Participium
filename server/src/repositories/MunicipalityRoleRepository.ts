import {Repository} from "typeorm";
import {AppDataSource} from "@database";
import {MunicipalityRoleDAO} from "@daos/MunicipalityRoleDAO";

export class MunicipalityRoleRepository {

    private repo: Repository<MunicipalityRoleDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(MunicipalityRoleDAO);
    }

    findRoleById = async (id: number): Promise<MunicipalityRoleDAO | null> => {
        return this.repo.findOneBy({ id });
    }

    findAllRoles = async (): Promise<MunicipalityRoleDAO[]> => {
        return this.repo.find({relations: ['categories']});  // add 'users' relation if needed, remember to update MunicipalityRoleDTO
    }
}

export const municipalityRoleRepository = new MunicipalityRoleRepository();
