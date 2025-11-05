import AppError from '@errors/AppError';
import { logError } from '@utils/logger';
import { removeNullAttributes } from '@utils/mapper';

export interface ErrorDTO {
    code: number;
    name?: string;
    message?: string;
    errors?: Record<string, string | string[]>;
}

export function ErrorDTOFromJSON(json: any): ErrorDTO {
    if(json == null) return json;

    return {
        code: json['code'],
        name: json['name'] == null ? undefined : json['name'],
        message: json['message'] == null ? undefined : json['message']
    } as ErrorDTO;
}

export function ErrorDTOToJSON(dto: ErrorDTO): any {
    if(dto == null) return dto;

    return {
        code: dto.code,
        name: dto.name,
        message: dto.message,
        errors: dto.errors
    };
}

export const createErrorDTO = (code: number, message?: string, name?: string, errors?: Record<string, string | string[]>): ErrorDTO => {
    return removeNullAttributes({ code, name, message, errors }) as ErrorDTO;
}

export const createAppError = (err: any): ErrorDTO => {
    let modelError = createErrorDTO(500, err?.message || 'Internal Server Error', 'InternalServerError');

    logError(err);
    logError(`Error: ${err?.message}\nStacktrace:\n${err?.stack || 'No stacktrace available'}`);

    if(err instanceof AppError || (err.status && typeof err.status === 'number')) modelError = createErrorDTO(err.status, err.message, err.name, err.errors);

    return modelError;
}