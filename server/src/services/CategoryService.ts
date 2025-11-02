import { CategoryDTO, createCategoryDTO } from '@dtos/CategoryDTO';
import { categoryRepository, CategoryRepository } from '@repositories/CategoryRepository';

export class CategoryService {

    private categoryRepo: CategoryRepository;

    constructor() {
        this.categoryRepo = categoryRepository;
    }

    findAllCategories = async (): Promise<CategoryDTO[]> => {
        const categories = await this.categoryRepo.findAllCategories();
        return categories.map(createCategoryDTO);
    }
}

export const categoryService = new CategoryService();