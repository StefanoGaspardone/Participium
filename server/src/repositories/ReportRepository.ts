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
        return this.repo.find({ where: { status }, relations: ["category", "createdBy", "assignedTo", "coAssignedTo", "coAssignedTo.company"] });
    }

    findReportsByUserId = async (userId: number): Promise<ReportDAO[]> => {
        return await this.repo.find({ where: { createdBy: { id: userId } }, relations: ["category", "createdBy", "assignedTo", "coAssignedTo", "coAssignedTo.company"] });
    }

    findReportById = async (id: number): Promise<ReportDAO | null> => {
        return this.repo.findOne({ where: { id }, relations: ["category", "category.office", "createdBy", "assignedTo", "coAssignedTo", "coAssignedTo.company"] });
    }

    save = async (report: ReportDAO): Promise<ReportDAO> => {
        return this.repo.save(report);
    }

    findReportsAssignedTo = async (userId: number): Promise<ReportDAO[]> => {
        return this.repo.find({
            where: { assignedTo: { id: userId } as any },
            relations: ["category", "category.office", "createdBy", "assignedTo", "coAssignedTo", "coAssignedTo.company"],
            order: { createdAt: "DESC" }
        });
    }

    findReportsCoAssignedTo = async (userId: number): Promise<ReportDAO[]> => {
        return this.repo.find({
            where: { coAssignedTo: { id: userId } as any },
            relations: ["category", "createdBy", "assignedTo", "coAssignedTo", "coAssignedTo.company"],
            order: { createdAt: "DESC" }
        });
    }
}

export const reportRepository = new ReportRepository();