import { reportController } from '@controllers/ReportController';
import { Router } from 'express';

const router = Router();

router.post('/', reportController.createReport); // TODO auth middleware

export const reportRouter = router;