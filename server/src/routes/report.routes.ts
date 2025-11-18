import { reportController } from '@controllers/ReportController';
import { UserType } from '@daos/UserDAO';
import { authMiddleware } from '@middlewares/authenticationMiddleware';
import { Router } from 'express';

const router = Router();

router.post('/', authMiddleware([UserType.CITIZEN]), reportController.createReport);
router.post('/telegram', reportController.createReportFromTelegram);
router.get('/', reportController.getReportsByStatus);
router.put(
    '/:id/category',
    authMiddleware([UserType.PUBLIC_RELATIONS_OFFICER, UserType.MUNICIPAL_ADMINISTRATOR]),
    reportController.updateReportCategory
);
router.put(
    '/:id/status',
    authMiddleware([UserType.PUBLIC_RELATIONS_OFFICER]),
    reportController.updateReportStatus
);

export const reportRouter = router;