export interface Category {
	id: number;
	name: string;
}

export interface Office {
	id: number;
	name: string;
}

export interface User {
	id: number;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    image?: string | null;
    telegramUsername?: string | null;
    userType: string;
    emailNotificationsEnabled: boolean;
    // office?: string | null;
    // createdAt: Date;
}

export type FieldErrors = Record<string, string | string[]>;

export class ApiError extends Error {
	status: number;
	errors?: FieldErrors;
	raw?: unknown;

	constructor(message: string, status: number, errors?: FieldErrors, raw?: unknown) {
		super(message);

		this.name = 'ApiError';
		this.status = status;
		this.errors = errors;
		this.raw = raw;
	}
}

export const isApiError = (err: unknown): err is ApiError => typeof err === 'object' && err !== null && 'name' in (err as Record<string, unknown>) && (err as { name?: unknown }).name === 'ApiError';

export const toApiError = async (res: Response): Promise<ApiError> => {
	try {
		const data = await res.json();
		const message = data?.message || `HTTP ${res.status}`;
		const errors: FieldErrors | undefined = data?.errors;
		return new ApiError(message, res.status, errors, data);
	} catch {
		const text = await res.text().catch(() => '');
		return new ApiError(text || `HTTP ${res.status}`, res.status);
	}
};