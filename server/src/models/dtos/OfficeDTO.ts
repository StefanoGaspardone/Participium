import {OfficeDAO} from "@daos/OfficeDAO";
import {MapUserDAOtoDTO, UserDTO} from "@dtos/UserDTO";
import {CategoryDTO, createCategoryDTO} from "@dtos/CategoryDTO";


export class OfficeDTO {
    id: number;
    name: string;
//    categories: CategoryDTO[];
//    users: UserDTO[];
}

export const mapOfficeDAOtoDTO = (role: OfficeDAO): OfficeDTO => {
    return {
        id: role.id,
        name: role.name,
//        categories: role.categories.map(createCategoryDTO),
//        users: role.users.map(MapUserDAOtoDTO),
    };
}