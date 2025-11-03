import { CreateReportDTO } from '@dtos/ReportDTO';
import { reportService, ReportService } from '@services/ReportService';
import { Request, Response, NextFunction } from 'express';

export class ReportController {

    private reportService: ReportService;

    constructor() {
        this.reportService = reportService;
    }

    createReport = async (req: Request<{}, {}, { payload: CreateReportDTO }>, res: Response, next: NextFunction) => {
        try {
            const { payload } = req.body;
            const userId = req.user?.id;

            await this.reportService.createReport(userId as number, payload);
            res.status(201).json({ message: 'Report successfully created' });
        } catch(error) {
            next(error);
        }
    }
}

export const reportController = new ReportController();