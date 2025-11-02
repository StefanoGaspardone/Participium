import { categoryController } from '@controllers/CategoryController';
import { Router } from 'express';

const router = Router();

router.get('/', categoryController.findAllCategories); // TODO auth middleware

export const categoryRouter = router;