import { createAppError, ErrorDTOToJSON } from '@dtos/ErrorDTO';
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    let error = createAppError(err);
    res.status(error.code).json(ErrorDTOToJSON(error));
}