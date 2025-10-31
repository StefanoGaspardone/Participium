import { AppError } from '@errors/AppError';

export class UnauthorizedError extends AppError {
    constructor(message: string) {
        super(message, 401);
        this.name = 'UnauthorizedError';
    }
}