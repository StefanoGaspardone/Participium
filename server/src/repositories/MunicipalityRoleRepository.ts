import {Repository} from "typeorm";
import {AppDataSource} from "@database";
import {MunicipalityRoleDAO} from "@daos/MunicipalityRoleDAO";

export class MunicipalityRoleRepository {

    private repo: Repository<MunicipalityRoleDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(MunicipalityRoleDAO);
    }

    findRoleByName = async (name: string): Promise<MunicipalityRoleDAO | null> => {
        return this.repo.findOneBy({ name });
    }
}

export const municipalityRoleRepository = new MunicipalityRoleRepository();
