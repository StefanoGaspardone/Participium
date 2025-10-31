import { AppError } from '@errors/AppError';

export class InsufficientRightsError extends AppError {
    constructor(message: string) {
        super(message, 403);
        this.name = 'InsufficientRightsError';
    }
}