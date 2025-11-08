import {municipalityRoleRepository, OfficeRepository} from "@repositories/OfficeRepository";
import {mapRolesDAOtoDTO, OfficeRoleDTO} from "@dtos/OfficeRoleDTO";

export class MunicipalityRoleService {

    private municipalityRepo: OfficeRepository;

    constructor() {
        this.municipalityRepo = municipalityRoleRepository;
    }

    findAllMunicipalityRoles = async (): Promise<OfficeRoleDTO[]> => {
        const roles = await this.municipalityRepo.findAllRoles();
        return roles.map(mapRolesDAOtoDTO);
    }
}

export const municipalityRoleService = new MunicipalityRoleService();