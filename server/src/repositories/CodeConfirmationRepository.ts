import { CodeConfirmationDAO } from "@daos/CodeConfirmationDAO";
import { AppDataSource } from "@database";
import { Repository } from "typeorm";

export class CodeConfirmationRepository {

    private readonly repo: Repository<CodeConfirmationDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(CodeConfirmationDAO);
    }

    save = async (code: CodeConfirmationDAO): Promise<CodeConfirmationDAO> => {
        return await this.repo.save(code);
    }

    findByUserId = async (userId: number): Promise<CodeConfirmationDAO | null> => {
        return await this.repo.findOne({ where: { user: { id: userId } }, relations: ['user'] });
    }

    deleteById = async (id: number) => {
        await this.repo.delete(id);
    }
}

export const codeRepository = new CodeConfirmationRepository();