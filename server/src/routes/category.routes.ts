import { categoryController } from '@controllers/CategoryController';
import { Router } from 'express';

const router = Router();

router.get('/', categoryController.findAllCategories);

export const categoryRouter = router;