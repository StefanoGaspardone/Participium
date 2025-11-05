import { CONFIG } from '@config';
import { CreateReportDTO } from '@dtos/ReportDTO';
import { BadRequestError } from '@errors/BadRequestError';
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

            const errors: Record<string, string> = {};
            if(!payload.title || payload.title === undefined || typeof payload.title !== 'string') errors.title = 'Title must be a non-empty string';
            if(!payload.description || payload.description === undefined || typeof payload.description !== 'string') errors.title = 'Description must be a non-empty string';
            if(!payload.categoryId || payload.categoryId === undefined || typeof payload.categoryId !== 'number' || Number.isNaN(payload.categoryId)) errors.title = 'CategoryId must be a positive number';
            if(!payload.images || payload.images === undefined || !Array.isArray(payload.images) || payload.images.length < 1 || payload.images.length > 3) errors.title = 'images must be an array with 1 to 3 items';
            if(!payload.lat || payload.lat === undefined || typeof payload.lat === 'number' && !Number.isNaN(payload.lat) || payload.lat < CONFIG.TURIN.MIN_LAT || payload.lat > CONFIG.TURIN.MAX_LAT) errors.lat = `Latitude must be a number between ${CONFIG.TURIN.MIN_LAT} and ${CONFIG.TURIN.MAX_LAT}`;
            if(!payload.long || payload.long === undefined || typeof payload.long === 'number' && !Number.isNaN(payload.long) || payload.long < CONFIG.TURIN.MIN_LONG || payload.long > CONFIG.TURIN.MAX_LONG) errors.lat = `Longitude must be a number between ${CONFIG.TURIN.MIN_LONG} and ${CONFIG.TURIN.MAX_LONG}`;
            if(!payload.anonymous || payload.anonymous === undefined || typeof payload.anonymous === 'boolean') errors.anonymous = 'Anonymous must be a boolean';

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