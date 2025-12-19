import {ReportDAO, ReportStatus} from '@daos/ReportDAO';
import {createReportDTO, CreateReportDTO, ReportDTO} from '@dtos/ReportDTO';
import {UserDAO, UserType} from '@daos/UserDAO';
import {NotFoundError} from '@errors/NotFoundError';
import {BadRequestError} from '@errors/BadRequestError';
import {categoryRepository, CategoryRepository} from '@repositories/CategoryRepository';
import {reportRepository, ReportRepository} from '@repositories/ReportRepository';
import {userRepository, UserRepository} from '@repositories/UserRepository';
import {NewNotificationDTO} from "@dtos/NotificationDTO";
import {notificationService, NotificationService} from "@services/NotificationService";
import { InsufficientRightsError } from '@errors/InsufficientRightsError';

export class ReportService {

    private reportRepo: ReportRepository;
    private categoryRepo: CategoryRepository;
    private userRepo: UserRepository;
    private notificationService: NotificationService;

    constructor() {
        this.reportRepo = reportRepository;
        this.categoryRepo = categoryRepository;
        this.userRepo = userRepository;
        this.notificationService = notificationService;
    }

    createReport = async (userId: number, inputData: CreateReportDTO): Promise<ReportDTO> => {
        const category = await this.categoryRepo.findCategoryById(inputData.categoryId);
        if (!category) throw new NotFoundError(`Category ${inputData.categoryId} not found`);

        const report = new ReportDAO();
        report.title = inputData.title.trim();
        report.description = inputData.description.trim();
        report.category = category;
        report.images = inputData.images.map(image => image.trim());
        report.lat = inputData.lat;
        report.long = inputData.long;
        report.status = ReportStatus.PendingApproval;
        report.anonymous = inputData.anonymous || false;
        report.createdAt = new Date();

        const user = new UserDAO();
        user.id = userId;
        report.createdBy = user;

        const reportDto = await this.reportRepo.createReport(report);
        return createReportDTO(reportDto);
    }

    listReportsByStatus = async (status: ReportStatus): Promise<ReportDTO[]> => {
        const reports = await this.reportRepo.findReportsByStatus(status);
        return reports.map(createReportDTO);
    }

    listReportsByUserId = async (userId: number): Promise<ReportDTO[]> => {
        const reports = await this.reportRepo.findReportsByUserId(userId);
        return reports.map(createReportDTO);
    }

    findByIdAndUserId = async (reportId: number, userId: number): Promise<ReportDTO> => {
        const report = await this.reportRepo.findReportById(reportId);
        
        if(!report) throw new NotFoundError(`Report ${reportId} not found`);
        if(report.createdBy.id !== userId) throw new InsufficientRightsError(`Report ${reportId} does not belong to user ${userId}`);

        return createReportDTO(report);
    }

    updateReportCategory = async (reportId: number, categoryId: number): Promise<ReportDTO> => {
        const report = await this.reportRepo.findReportById(reportId);
        if (!report) throw new NotFoundError(`Report ${reportId} not found`);

        const category = await this.categoryRepo.findCategoryById(categoryId);
        if (!category) throw new NotFoundError(`Category ${categoryId} not found`);

        report.category = category;
        const updated = await this.reportRepo.save(report);
        return createReportDTO(updated);
    }

    assignOrRejectReport = async (
        reportId: number,
        newStatus: ReportStatus,
        rejectedDescription?: string
    ): Promise<ReportDTO> => {
        const report = await this.reportRepo.findReportById(reportId);
        if (!report) throw new NotFoundError(`Report ${reportId} not found`);

        if (report.status !== ReportStatus.PendingApproval) {
            throw new BadRequestError('Only reports in PendingApproval can be accepted or rejected');
        }

        const previousStatus = report.status;
        if (newStatus === ReportStatus.Assigned) {
            const office = report.category?.office;
            if (!office || !office.id) throw new BadRequestError('Report category has no associated office');

            const assignee = await this.userRepo.findLeastLoadedStaffForOffice(office.id);
            if (!assignee) throw new BadRequestError('No technical staff member available for this office');

            report.status = ReportStatus.Assigned;
            report.assignedTo = assignee;
            report.rejectedDescription = null as any;
        } else if (newStatus === ReportStatus.Rejected) {
            if (!rejectedDescription || typeof rejectedDescription !== 'string' || !rejectedDescription.trim()) {
                const err: any = new BadRequestError('Validation failed');
                err.errors = { rejectedDescription: 'rejectedDescription is required when rejecting a report' };
                throw err;
            }
            report.status = ReportStatus.Rejected;
            report.rejectedDescription = rejectedDescription.trim();
        } else {
            throw new BadRequestError('Invalid status transition. Allowed: Assigned or Rejected');
        }

        const updated = await this.reportRepo.save(report);

        const notifications:NewNotificationDTO = {
            userId: report.createdBy.id,
            reportId: report.id,
            previousStatus: previousStatus,
            newStatus: newStatus
        };
        await this.notificationService.createNotification(notifications);

        return createReportDTO(updated);
    }

    listAssignedReports = async (userId: number): Promise<ReportDTO[]> => {
        const user = await this.userRepo.findUserById(userId);
        if (!user) throw new NotFoundError(`User ${userId} not found`);
        if (user.userType === UserType.TECHNICAL_STAFF_MEMBER) {
            const reports = await this.reportRepo.findReportsAssignedTo(userId);
            return reports.map(createReportDTO);
        }else if (user.userType === UserType.EXTERNAL_MAINTAINER) {
            const reports = await this.reportRepo.findReportsCoAssignedTo(userId);
            return reports.map(createReportDTO);
        }else{
            throw new BadRequestError('Only technical staff members and external maintainers have assigned reports');
        }
    }

    updateReportStatus = async (
        reportId: number,
        newStatus: ReportStatus,
        userId: number,
        userType: string
    ): Promise<ReportDTO> => {
        const report = await this.reportRepo.findReportById(reportId);
        if (!report) throw new NotFoundError(`Report ${reportId} not found`);

        if (report.status === ReportStatus.Resolved){
            throw new BadRequestError('Resolved reports cannot change status');
        }
        if (report.status === ReportStatus.Assigned && newStatus !== ReportStatus.InProgress) {
            throw new BadRequestError('Invalid status transition. Accepted report con only move to InProgress');
        }

        if (report.status === ReportStatus.InProgress && ![ReportStatus.Resolved, ReportStatus.Suspended].includes(newStatus)) {
            throw new BadRequestError('Invalid status transition. InProgress report can only move to Resolved or Suspended');
        }

        if(report.status === ReportStatus.Suspended && newStatus !== ReportStatus.InProgress) {
            throw new BadRequestError('Invalid status transition. Suspended report can only move to InProgress');
        }

        if(userType === UserType.TECHNICAL_STAFF_MEMBER && report.assignedTo.id !== userId){
            throw new BadRequestError("You're not assigned to the report");
        }else if(userType === UserType.EXTERNAL_MAINTAINER && !report.coAssignedTo){
            throw new BadRequestError("There's no external maintainer assigned to the report");
        }else if(userType === UserType.EXTERNAL_MAINTAINER && report.coAssignedTo.id !== userId){
            throw new BadRequestError("You're not assigned to the report");
        }

        const notifications:NewNotificationDTO = {
            userId: report.createdBy.id,
            reportId: report.id,
            previousStatus: report.status,
            newStatus: newStatus
        };
        report.status = newStatus;
        const updated = await this.reportRepo.save(report);

        await this.notificationService.createNotification(notifications);

        return createReportDTO(updated);
    }

    assignExternalMaintainer = async (
        reportId: number,
        tosmId: number,
        maintainerId: number
    ): Promise<ReportDTO> => {
        const report = await this.reportRepo.findReportById(reportId);
        if (!report) throw new NotFoundError(`Report ${reportId} not found`);

        if(report.assignedTo.id !== tosmId){
            throw new BadRequestError("You're not assigned to the report");
        }

        const maintainer = await this.userRepo.findUserById(maintainerId);
        if(!maintainer){
            throw new NotFoundError(`Maintainer with id ${maintainerId} not found`);
        }
        if(maintainer.userType !== 'EXTERNAL_MAINTAINER'){
            throw new BadRequestError(`User with id ${maintainerId} is not an external maintainer`);
        }

        /*
        if(!maintainer.company.categories.includes(report.category)){
            throw new BadRequestError(`Maintainer with id ${maintainerId} is not authorized to maintain reports of category ${report.category.id}`);
        }*/

        report.coAssignedTo = maintainer;
        const updated = await this.reportRepo.save(report);
        return createReportDTO(updated);
    }
}

export const reportService = new ReportService();