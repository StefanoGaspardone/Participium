import { reportController } from '@controllers/ReportController';
import { UserType } from '@daos/UserDAO';
import { authMiddleware } from '@middlewares/authenticationMiddleware';
import { Router } from 'express';

const router = Router();

router.post('/', authMiddleware([UserType.CITIZEN]), reportController.createReport);
router.post('/telegram', reportController.createReportFromTelegram);
router.get('/mine', authMiddleware([UserType.CITIZEN]), reportController.getMyReports);
router.get('/', reportController.getReportsByStatus);
router.put(
    '/:id/category',
    authMiddleware([UserType.PUBLIC_RELATIONS_OFFICER, UserType.MUNICIPAL_ADMINISTRATOR]),
    reportController.updateReportCategory
);
router.put(
    '/:id/status/public',
    authMiddleware([UserType.PUBLIC_RELATIONS_OFFICER]),
    reportController.assignOrRejectReport
);
router.put(
    '/:id/assign-external',
    authMiddleware([UserType.TECHNICAL_STAFF_MEMBER]),
    reportController.assignExternalMaintainer
)
router.get(
    '/assigned',
    authMiddleware([UserType.TECHNICAL_STAFF_MEMBER, UserType.EXTERNAL_MAINTAINER]),
    reportController.getAssignedReports
);

router.put(
    '/:id/status/technical',
    authMiddleware([UserType.TECHNICAL_STAFF_MEMBER, UserType.EXTERNAL_MAINTAINER]),
    reportController.updateReportStatus
);
router.get('/:id', authMiddleware([UserType.CITIZEN]), reportController.getReportById);

export const reportRouter = router;