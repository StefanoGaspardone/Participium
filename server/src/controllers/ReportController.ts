import { CreateReportDTO, CreateReportTelegramDTO } from '@dtos/ReportDTO';
import { BadRequestError } from '@errors/BadRequestError';
import { reportService, ReportService } from '@services/ReportService';
import { Response, NextFunction, Request } from 'express';
import type { AuthRequest } from '@middlewares/authenticationMiddleware';
import { isPointInTurin } from '@utils/geo_turin';
import { ReportStatus } from '@daos/ReportDAO';
import { ChatService, chatService } from '@services/ChatService';
import { createChatDTO } from '@dtos/ChatDTO';

export class ReportController {

    private readonly reportService: ReportService;
    private readonly chatService: ChatService;

    constructor() {
        this.reportService = reportService;
        this.chatService = chatService;
    }

    createReport = async (req: AuthRequest & { body: { payload: CreateReportDTO } }, res: Response, next: NextFunction) => {
        try {
            const { payload } = req.body;
            const userId = req.token?.user?.id;

            const errors: Record<string, string> = {};
            if (typeof payload.title !== 'string') errors.title = 'Title must be a non-empty string';
            if (typeof payload.description !== 'string') errors.description = 'Description must be a not-empty string';
            if (typeof payload.categoryId !== 'number' || Number.isNaN(payload.categoryId) || payload.categoryId <= 0) errors.categoryId = 'CategoryId must be a positive number';
            if (!Array.isArray(payload.images) || payload.images.length < 1 || payload.images.length > 3) errors.images = 'Images must be an array with 1 to 3 items';
            if (typeof payload.lat !== 'number' || Number.isNaN(payload.lat) || typeof payload.long !== 'number' || Number.isNaN(payload.long) || !isPointInTurin(payload.lat, payload.long)) errors.location = 'The location has to be inside the Municipality of Turin';
            if (typeof payload.anonymous !== 'boolean') errors.anonymous = 'Anonymous must be a boolean';

            if (Object.keys(errors).length > 0) {
                const err: any = new BadRequestError('Validation failed');
                err.errors = errors;
                return next(err);
            }

            await this.reportService.createReport(userId as number, payload);
            res.status(201).json({ message: 'Report successfully created' });
        } catch (error) {
            next(error);
        }
    }

    /* istanbul ignore next */
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

            const report = await this.reportService.createReport(userId, payloadDto);
            res.status(201).json({ message: 'Report successfully created', reportId: report.id });
        } catch (error) {
            next(error);
        }
    }

    getReportsByStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const statusParam = String(req.query.status || '').trim();

            const errors: Record<string, string> = {};
            const validStatuses = Object.values(ReportStatus);
            if (!statusParam) errors.status = 'Query parameter "status" is required';
            else if (!validStatuses.includes(statusParam as ReportStatus)) errors.status = `Invalid status. Must be one of: ${validStatuses.join(', ')}`;

            if (Object.keys(errors).length > 0) {
                const err: any = new BadRequestError('Validation failed');
                err.errors = errors;
                return next(err);
            }

            const reports = await this.reportService.listReportsByStatus(statusParam as ReportStatus);
            res.status(200).json({ reports });
        } catch (error) {
            next(error);
        }
    }

    assignOrRejectReport = async (
        req: AuthRequest & { params: { id: string }, body: { status?: string; rejectedDescription?: string } },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const idParam = Number(req.params.id);
            const { status, rejectedDescription } = req.body || {};

            const errors: Record<string, string> = {};
            if (Number.isNaN(idParam) || idParam <= 0) errors.id = 'Report id must be a positive number';

            const allowed = [ReportStatus.Assigned, ReportStatus.Rejected];
            if (!status || typeof status !== 'string' || !allowed.includes(status as ReportStatus)) {
                errors.status = `Status must be one of: ${allowed.join(', ')}`;
            }
            if (status === ReportStatus.Rejected && !rejectedDescription?.trim()) {
                errors.rejectedDescription = 'rejectedDescription is required when rejecting a report';
            }

            if (Object.keys(errors).length > 0) {
                const err: any = new BadRequestError('Validation failed');
                err.errors = errors;
                return next(err);
            }

            const updated = await this.reportService.assignOrRejectReport(
                idParam,
                status as ReportStatus,
                rejectedDescription
            );

            // IF the report is accepted and therefore assigned, the chat between the issuer citizen and the tosm is created
            if (updated.assignedTo && updated.status === ReportStatus.Assigned) {
                const chats = await chatService.findByReportId(updated.id);
                if (chats.length === 0) {
                    // if we enter here, no chats were created, then we have to create it (them later)
                    const payload = {} as createChatDTO;
                    payload.tosm_user_id = updated.assignedTo.id;
                    payload.second_user_id = updated.createdBy.id;
                    payload.report_id = updated.id;
                    await chatService.createChat(payload);
                }
            }
            // IF the report is rejected NO chat has to be created (rejection description does the job)
            if(updated.status === ReportStatus.Assigned) {
                res.status(200).json({message: `Report assigned to ${updated.assignedTo?.username}`, report: updated});
            }else {
                res.status(200).json({message: 'Report successfully rejected', report: updated});
            }
        } catch (error) {
            next(error);
        }
    }

    updateReportCategory = async (req: AuthRequest & { params: { id: string }, body: { categoryId: number } }, res: Response, next: NextFunction) => {
        try {
            const idParam = Number(req.params.id);
            const { categoryId } = req.body || {};

            const errors: Record<string, string> = {};
            if (Number.isNaN(idParam) || idParam <= 0) errors.id = 'Report id must be a positive number';
            if (typeof categoryId !== 'number' || Number.isNaN(categoryId) || categoryId <= 0) errors.categoryId = 'CategoryId must be a positive number';

            if (Object.keys(errors).length > 0) {
                const err: any = new BadRequestError('Validation failed');
                err.errors = errors;
                return next(err);
            }

            const report = await this.reportService.updateReportCategory(idParam, categoryId);
            res.status(200).json({ message: 'Report category updated', report });
        } catch (error) {
            next(error);
        }
    }

    getAssignedReports = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.token?.user?.id;
            if (!userId) {
                const err: any = new BadRequestError('Validation failed');
                err.errors = { auth: 'Missing user id in token' };
                return next(err);
            }

            const reports = await this.reportService.listAssignedReports(userId);
            res.status(200).json({ reports });
        } catch (error) {
            next(error);
        }
    }

    /**
     * The function to update the status of an existing report.
     * If the status goes from x -> InProgress, then the chat between the Citizen creator of the report and the TOSM 
     * in charge of it is created 
     * @param req 
     * @param res 
     * @param next 
     * @returns 
     */
    updateReportStatus = async (
        req: AuthRequest & { params: { id: string }, body: { status: string } },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const idParam = Number(req.params.id);
            const userId = req.token?.user?.id;
            const userType = req.token?.user?.userType;
            if (!userId || !userType) {
                throw new BadRequestError('Missing token');
            }

            const { status } = req.body || {};

            const errors: Record<string, string> = {};
            if (Number.isNaN(idParam) || idParam <= 0) errors.id = 'Report id must be a positive number';

            const allowedStatuses = Object.values(ReportStatus);
            if (!status || typeof status !== 'string' || !allowedStatuses.includes(status as ReportStatus)) {
                errors.status = `Status must be one of: ${allowedStatuses.join(', ')}`;
            }

            if (Object.keys(errors).length > 0) {
                const err: any = new BadRequestError('Validation failed');
                err.errors = errors;
                return next(err);
            }

            const updated = await this.reportService.updateReportStatus(idParam, status as ReportStatus, userId, userType);
            res.status(200).json({ message: 'Report status updated and chat citizen-tosm created', report: updated });
        } catch (error) {
            next(error);
        }
    }
    assignExternalMaintainer = async (req: AuthRequest & { params: { id: string } }, res: Response, next: NextFunction) => {
        try {
            const reportId = Number(req.params.id);
            if (Number.isNaN(reportId) || reportId <= 0) {
                throw new BadRequestError('Report id must be a positive number');
            }
            const tosm_id = req.token?.user?.id;
            if (!tosm_id) {
                throw new BadRequestError('Missing user id in token');
            }
            if (!req.body.maintainerId || typeof req.body.maintainerId !== 'number' || req.body.maintainerId <= 0) {
                throw new BadRequestError('maintainerId is missing or it is not a positive number');
            }
            const updatedReport = await this.reportService.assignExternalMaintainer(reportId, tosm_id, req.body.maintainerId);

            // IF an external maintainer is assigned to a report, the chat between him and the tosm who assigned it is created

            // we check if 1 exists, bc it's the one created when "acceptin + assigning" the report
            if (updatedReport.assignedTo && updatedReport.coAssignedTo && updatedReport.coAssignedTo.id !== 13) {
                const chats = await chatService.findByReportId(updatedReport.id);
                if (chats.length === 1) {
                    const payload = {} as createChatDTO;
                    payload.tosm_user_id = updatedReport.assignedTo.id;
                    payload.second_user_id = updatedReport.coAssignedTo.id;
                    payload.report_id = updatedReport.id;
                    await chatService.createChat(payload);
                }
            }
            return res.status(201).json(updatedReport);

        } catch (error) {
            next(error);
        }
    }

    getMyReports = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const reports = await reportService.listReportsByUserId(req.token?.user?.id as number);
            return res.status(200).json({ reports });
        } catch(error) {
            next(error);
        }
    }

    getReportById = async (req: AuthRequest & { params: { id: number } }, res: Response, next: NextFunction) => {
        try {
            const reportId = Number(req.params.id);
            if( Number.isNaN(reportId) || reportId <= 0) {
                throw new BadRequestError('Report id must be a positive number');
            }
            const report = await this.reportService.findByIdAndUserId(reportId, req.token?.user?.id as number);
            return res.status(200).json({ report });
        } catch(error) {
            next(error);
        }
    }
}

export const reportController = new ReportController();