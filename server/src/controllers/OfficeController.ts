import {officeService, OfficeService} from "@services/OfficeService";
import { Request, Response, NextFunction } from 'express';

export class OfficeController {

    private officeService: OfficeService;

    constructor() {
        this.officeService = officeService;
    }

    findAllOffices = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const offices = await this.officeService.findAllOffices();
            res.status(200).json(offices);
        } catch(error) {
            next(error);
        }
    }
}

export const officeController = new OfficeController();