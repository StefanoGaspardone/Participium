import { uploadService, UploadService } from '@services/uploadService';
import { Request, Response, NextFunction } from 'express';

export class UploadController {

    private uploadService: UploadService;

    constructor() {
        this.uploadService = uploadService;
    }

    sign = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const signParams = await this.uploadService.sign();
            res.status(200).json(signParams);
        } catch(error) {
            next(error);
        }
    }
}

export const uploadController = new UploadController();