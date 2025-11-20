import { ReportDAO } from "@daos/ReportDAO";
import { AppDataSource } from "@database";
import { Repository } from "typeorm";

export class ReportRepository {

    private repo: Repository<ReportDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(ReportDAO);
    }

    findReportById = async (id: number): Promise<ReportDAO | null> => {
        return this.repo.findOne({ where: { id }});
    }

    createReport = async (report: ReportDAO): Promise<ReportDAO> => {
        return this.repo.save(report);
    }
}

export const reportRepository = new ReportRepository();