import {municipalityRoleService, MunicipalityRoleService} from "@services/MunicipalityRoleService";
import { Request, Response, NextFunction } from 'express';

export class MunicipalityRoleController {

    private municipalityService: MunicipalityRoleService;

    constructor() {
        this.municipalityService = municipalityRoleService;
    }

    findAllRoles = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const roles = await this.municipalityService.findAllMunicipalityRoles();
            res.status(200).json(roles);
        } catch(error) {
            next(error);
        }
    }
}

export const municipalityRoleController = new MunicipalityRoleController();