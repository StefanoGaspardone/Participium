import { CategoryDAO } from '@daos/CategoryDAO';
import { AppDataSource } from '@database';
import { Repository } from 'typeorm';

export class CategoryRepository {

    private readonly repo: Repository<CategoryDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(CategoryDAO);
    }

    findAllCategories = async (): Promise<CategoryDAO[]> => {
        return this.repo.find();
    }

    findCategoryById = async (id: number): Promise<CategoryDAO | null> => {
        return this.repo.findOne({ where: { id } });
    }

}

export const categoryRepository = new CategoryRepository();