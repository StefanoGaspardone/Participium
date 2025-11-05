import { ReportDAO, ReportStatus } from '@daos/ReportDAO';
import { UserDAO } from '@daos/UserDAO';
import { CreateReportDTO } from '@dtos/ReportDTO';
import { NotFoundError } from '@errors/NotFoundError';
import { categoryRepository, CategoryRepository } from '@repositories/CategoryRepository';
import { reportRepository, ReportRepository } from '@repositories/ReportRepository';

export class ReportService {

    private reportRepo: ReportRepository;
    private categoryRepo: CategoryRepository;

    constructor() {
        this.reportRepo = reportRepository;
        this.categoryRepo = categoryRepository;
    }

    createReport = async (userId: number, inputData: CreateReportDTO): Promise<void> => {
        const category = await this.categoryRepo.findCategoryById(inputData.categoryId);
        if(!category) throw new NotFoundError(`Category ${inputData.categoryId} not found`);

        const report = new ReportDAO();
        report.title = inputData.title.trim();
        report.description = inputData.description.trim();
        report.category = category;
        report.images = inputData.images.map(image => image.trim());
        report.status = ReportStatus.PendingApproval;
        report.anonymous = inputData.anonymous || false;
        report.createdAt = new Date();
        
        const user = new UserDAO();
        user.id = userId;
        report.createdBy = user;

        await this.reportRepo.createReport(report);
    }
}

export const reportService = new ReportService();