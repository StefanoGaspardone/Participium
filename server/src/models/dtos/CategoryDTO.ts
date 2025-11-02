import { CategoryDAO } from '@daos/CategoryDAO';

export interface CategoryDTO {
    id: number;
    name: string;
}

export const createCategoryDTO = (category: CategoryDAO): CategoryDTO => {
    return {
        id: category.id,
        name: category.name,
    };
}