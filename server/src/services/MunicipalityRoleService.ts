import {municipalityRoleRepository, MunicipalityRoleRepository} from "@repositories/MunicipalityRoleRepository";
import {mapRolesDAOtoDTO, MunicipalityRoleDTO} from "@dtos/MunicipalityRoleDTO";

export class MunicipalityRoleService {

    private municipalityRepo: MunicipalityRoleRepository;

    constructor() {
        this.municipalityRepo = municipalityRoleRepository;
    }

    findAllMunicipalityRoles = async (): Promise<MunicipalityRoleDTO[]> => {
        const roles = await this.municipalityRepo.findAllRoles();
        return roles.map(mapRolesDAOtoDTO);
    }
}

export const municipalityRoleService = new MunicipalityRoleService();