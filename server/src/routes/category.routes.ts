import { categoryController } from '@controllers/CategoryController';
import { UserType } from '@daos/UserDAO';
import { authMiddleware } from '@middlewares/authenticationMiddleware';
import { Router } from 'express';

const router = Router();

router.get('/', authMiddleware([UserType.CITIZEN]), categoryController.findAllCategories);

export const categoryRouter = router;