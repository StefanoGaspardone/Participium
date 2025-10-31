import { AppError } from '@errors/AppError';

export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}