import { categoryService, CategoryService } from '@services/CategoryService';
import { Request, Response, NextFunction } from 'express';

export class CategoryController {

    private categoryService: CategoryService;

    constructor() {
        this.categoryService = categoryService;
    }

    findAllCategories = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const categories = await this.categoryService.findAllCategories();
            res.status(200).json({ categories });
        } catch(error) {
            next(error);
        }
    }
}

export const categoryController = new CategoryController();