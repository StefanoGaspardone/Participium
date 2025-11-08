import {OfficeDAO} from "@daos/OfficeDAO";
import {MapUserDAOtoDTO, UserDTO} from "@dtos/UserDTO";
import {CategoryDTO, createCategoryDTO} from "@dtos/CategoryDTO";


export class OfficeRoleDTO {
    id: number;
    name: string;
//    categories: CategoryDTO[];
//    users: UserDTO[];
}

export const mapRolesDAOtoDTO = (role: OfficeDAO): OfficeRoleDTO => {
    return {
        id: role.id,
        name: role.name,
//        categories: role.categories.map(createCategoryDTO),
//        users: role.users.map(MapUserDAOtoDTO),
    };
}