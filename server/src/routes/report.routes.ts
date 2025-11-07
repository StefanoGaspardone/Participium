import { reportController } from '@controllers/ReportController';
import { UserType } from '@daos/UserDAO';
import { authMiddleware } from '@middlewares/authenticationMiddleware';
import { Router } from 'express';

const router = Router();

router.post('/', authMiddleware([UserType.CITIZEN]), reportController.createReport);

export const reportRouter = router;