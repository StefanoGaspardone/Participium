import { ReportDAO, ReportStatus } from "@daos/ReportDAO";
import { AppDataSource } from "@database";
import { Repository } from "typeorm";

export class ReportRepository {

    private repo: Repository<ReportDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(ReportDAO);
    }

    createReport = async (report: ReportDAO): Promise<ReportDAO> => {
        return this.repo.save(report);
    }

    findReportsByStatus = async (status: ReportStatus): Promise<ReportDAO[]> => {
        return this.repo.find({ where: { status }, relations: ["category", "createdBy"] });
    }

    findReportById = async (id: number): Promise<ReportDAO | null> => {
        return this.repo.findOne({ where: { id }, relations: ["category", "category.office", "createdBy", "assignedTo"] });
    }

    save = async (report: ReportDAO): Promise<ReportDAO> => {
        return this.repo.save(report);
    }
}

export const reportRepository = new ReportRepository();