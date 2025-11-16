import { CreateReportDTO, CreateReportTelegramDTO } from '@dtos/ReportDTO';
import { BadRequestError } from '@errors/BadRequestError';
import { reportService, ReportService } from '@services/ReportService';
import { Response, NextFunction, Request } from 'express';
import type { AuthRequest } from '@middlewares/authenticationMiddleware';
import { isPointInTurin } from '@utils/geo_turin';

export class ReportController {

    private reportService: ReportService;

    constructor() {
        this.reportService = reportService;
    }

    createReport = async (req: AuthRequest & { body: { payload: CreateReportDTO } }, res: Response, next: NextFunction) => {
        try {
            const { payload } = req.body;
            const userId = req.token?.user?.id;

            const errors: Record<string, string> = {};
            if(typeof payload.title !== 'string') errors.title = 'Title must be a non-empty string';
            if(typeof payload.description !== 'string') errors.description = 'Description must be a not-empty string';
            if(typeof payload.categoryId !== 'number' || Number.isNaN(payload.categoryId) || payload.categoryId <= 0) errors.categoryId = 'CategoryId must be a positive number';
            if(!Array.isArray(payload.images) || payload.images.length < 1 || payload.images.length > 3) errors.images = 'Images must be an array with 1 to 3 items';
            if(!payload.latitude || !payload.longitude || !isPointInTurin(payload.latitude, payload.longitude)) errors.location = 'The location has to be inside the Municipality of Turin';
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

    createReportFromTelegram = async (req: Request<{}, {}, { payload: CreateReportTelegramDTO }>, res: Response, next: NextFunction) => {
        try {
            const { payload } = req.body;
            const userId = payload.userId;

            const payloadDto = {
                title: payload.title,
                description: payload.description,
                categoryId: payload.categoryId,
                images: payload.images,
                lat: payload.latitude,
                long: payload.longitude,
                anonymous: payload.anonymous,
            } as CreateReportDTO;

            const report = await this.reportService.createReport(userId as number, payloadDto);
            res.status(201).json({ message: 'Report successfully created', reportId: report.id });
        } catch(error) {
            next(error);
        }
    }
}

export const reportController = new ReportController();