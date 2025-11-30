import { CodeConfirmationDAO } from "@daos/CodeConfirmationDAO";
import { CodeConfirmationRepository, codeRepository } from "@repositories/CodeConfirmationRepository";
import { UserDAO } from '@daos/UserDAO';

export class CodeConfirmationService {

    private codeRepo: CodeConfirmationRepository;

    constructor() {
        this.codeRepo = codeRepository;
    }

    create = async (code: string, expirationDate: Date, user?: UserDAO): Promise<CodeConfirmationDAO> => {
        if(user) {
            const existing = await this.codeRepo.findByUserId(user.id);
            if(existing) {
                existing.code = code;
                existing.expirationDate = expirationDate;
                existing.user = user;
                return await this.codeRepo.save(existing);
            }

            const confirmation = new CodeConfirmationDAO();
            confirmation.code = code;
            confirmation.expirationDate = expirationDate;
            confirmation.user = user;
            return await this.codeRepo.save(confirmation);
        }

        const confirmation = new CodeConfirmationDAO();
        confirmation.code = code;
        confirmation.expirationDate = expirationDate;

        return await this.codeRepo.save(confirmation);
    }
}

export const codeService = new CodeConfirmationService();