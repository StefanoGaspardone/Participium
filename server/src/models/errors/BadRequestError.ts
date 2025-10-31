import { AppError } from '@errors/AppError';

export class BadRequestError extends AppError {
    constructor(message: string) {
        super(message, 400);
        this.name = 'BadRequestError';
    }
}