import { CompanyDAO } from "@daos/CompanyDAO";
import { CategoryDTO, createCategoryDTO } from "./CategoryDTO";

export interface CompanyDTO {
    id: number,
    name: string,
    categories: CategoryDTO[],
    // maintainers: UserDTO[],
}

export interface CreateCompanyDTO {
    // id: number,
    name: string, 
    categories: CategoryDTO[]
}

export function mapCompanyDAOtoDTO(dao: CompanyDAO): CompanyDTO {
    const dto: CompanyDTO = {
        id: dao.id,
        name: dao.name,
        categories: Array.isArray(dao.categories) ? dao.categories.map((m) => createCategoryDTO(m)) : []
    };
    return dto;
}