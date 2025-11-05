import { ReportDAO } from "@daos/ReportDAO";
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
}

export const reportRepository = new ReportRepository();