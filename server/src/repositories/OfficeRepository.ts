import {Repository} from "typeorm";
import {AppDataSource} from "@database";
import {OfficeDAO} from "@daos/OfficeDAO";

export class OfficeRepository {

    private repo: Repository<OfficeDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(OfficeDAO);
    }

    findOfficeById = async (id: number): Promise<OfficeDAO | null> => {
        return this.repo.findOneBy({ id });
    }

    findOrganizationOffice = async (): Promise<OfficeDAO | null> => {
        return this.repo.findOneBy({name : "Organization"});
    }

    findAllOffices = async (): Promise<OfficeDAO[]> => {
        return this.repo.find();  // add {relations: ['categories', 'users']} if needed, in case remember to update OfficeRoleDTO
    }
}

export const officeRepository = new OfficeRepository();
