import { categoryController } from '@controllers/CategoryController';
import { UserType } from '@daos/UserDAO';
import { authMiddleware } from '@middlewares/authenticationMiddleware';
import { Router } from 'express';

const router = Router();

router.get('/', categoryController.findAllCategories);

export const categoryRouter = router;