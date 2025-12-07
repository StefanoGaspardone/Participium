import { CodeConfirmationDAO } from "@daos/CodeConfirmationDAO";
import { CodeConfirmationRepository, codeRepository } from "@repositories/CodeConfirmationRepository";
import { UserDAO } from '@daos/UserDAO';

export class CodeConfirmationService {

    private codeRepo: CodeConfirmationRepository;

    constructor() {
        this.codeRepo = codeRepository;
    }

    create = async (code: string, expirationDate: Date, userId?: number): Promise<CodeConfirmationDAO> => {
        if(userId) {
            const existing = await this.codeRepo.findByUserId(userId);
            if(existing) {
                existing.code = code;
                existing.expirationDate = expirationDate;

                const user = new UserDAO();
                user.id = userId
                existing.user = user as any;
                return await this.codeRepo.save(existing);
            }

            const confirmation = new CodeConfirmationDAO();
            confirmation.code = code;
            confirmation.expirationDate = expirationDate;

            const user = new UserDAO();
            user.id = userId
            confirmation.user = user as any;
            return await this.codeRepo.save(confirmation);
        }

        const confirmation = new CodeConfirmationDAO();
        confirmation.code = code;
        confirmation.expirationDate = expirationDate;

        return await this.codeRepo.save(confirmation);
    }

    deleteById = async (id: number) => {
        await this.codeRepo.deleteById(id);
    }
}

export const codeService = new CodeConfirmationService();