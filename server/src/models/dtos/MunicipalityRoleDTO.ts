import {MunicipalityRoleDAO} from "@daos/MunicipalityRoleDAO";
import {MapUserDAOtoDTO, UserDTO} from "@dtos/UserDTO";
import {CategoryDTO, createCategoryDTO} from "@dtos/CategoryDTO";


export class MunicipalityRoleDTO {
    id: number;
    name: string;
    categories: CategoryDTO[];
//    users: UserDTO[];
}

export const mapRolesDAOtoDTO = (role: MunicipalityRoleDAO): MunicipalityRoleDTO => {
    return {
        id: role.id,
        name: role.name,
        categories: role.categories.map(createCategoryDTO),
//        users: role.users.map(MapUserDAOtoDTO),
    };
}