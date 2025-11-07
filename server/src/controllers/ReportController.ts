import { CONFIG } from '@config';
import { CreateReportDTO } from '@dtos/ReportDTO';
import { BadRequestError } from '@errors/BadRequestError';
import { reportService, ReportService } from '@services/ReportService';
import { Response, NextFunction } from 'express';
import type { AuthRequest } from '@middlewares/authenticationMiddleware';

export class ReportController {

    private reportService: ReportService;

    constructor() {
        this.reportService = reportService;
    }

    createReport = async (req: AuthRequest & { body: { payload: CreateReportDTO } }, res: Response, next: NextFunction) => {
        try {
            const { payload } = req.body;
            const userId = req.token?.userId;

            const errors: Record<string, string> = {};
            if(typeof payload.title !== 'string') errors.title = 'Title must be a non-empty string';
            if(typeof payload.description !== 'string') errors.description = 'Description must be a not-empty string';
            if(typeof payload.categoryId !== 'number' || Number.isNaN(payload.categoryId) || payload.categoryId <= 0) errors.categoryId = 'CategoryId must be a positive number';
            if(!Array.isArray(payload.images) || payload.images.length < 1 || payload.images.length > 3) errors.images = 'Images must be an array with 1 to 3 items';
            if(typeof payload.lat !== 'number' || Number.isNaN(payload.lat) || payload.lat < CONFIG.TURIN.MIN_LAT || payload.lat > CONFIG.TURIN.MAX_LAT) errors.lat = `Latitude must be a number between ${CONFIG.TURIN.MIN_LAT}° and ${CONFIG.TURIN.MAX_LAT}°`;
            if(typeof payload.long !== 'number' || Number.isNaN(payload.long) || payload.long < CONFIG.TURIN.MIN_LONG || payload.long > CONFIG.TURIN.MAX_LONG) errors.long = `Longitude must be a number between ${CONFIG.TURIN.MIN_LONG}° and ${CONFIG.TURIN.MAX_LONG}°`;
            if(typeof payload.anonymous !== 'boolean') errors.anonymous = 'Anonymous must be a boolean';

            if(Object.keys(errors).length > 0) {
                const err: any = new BadRequestError('Validation failed');
                err.errors = errors;
                return next(err);
            }

            await this.reportService.createReport(userId as number, payload);
            res.status(201).json({ message: 'Report successfully created' });
        } catch(error) {
            next(error);
        }
    }
}

export const reportController = new ReportController();