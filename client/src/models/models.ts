export interface Category {
  id: number,
  name: string,
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
  offices?: string[] | null;
  createdAt: Date;
  isActive: boolean;
  company?: Company | null;
}

export interface Report {
  id: number;
  title: string;
  description: string;
  category: Category;
  images: string[];
  lat: number;
  long: number;
  status: string;
  anonymous?: boolean;
  rejectedDescription?: string | null;
  createdBy?: Partial<User>;
  createdAt: string | Date;
  assignedTo?: Partial<User> | null;
  coAssignedTo?: Partial<User> | null;
}

export interface Message {
  id: number;
  text: string;
  sentAt: Date;
  sender: Partial<User>;
  receiver: Partial<User>;
  chat: Chat
}

export interface Chat {
  id: number,
  chatType: string,
  tosm_user: Partial<User>,
  second_user: Partial<User>,
  report: Report,
  messages: Message[];
}

export interface Company {
  id: number,
  name: string, 
  categories: Category[],
  // maintainers: User[]
}

export interface Coord {
  lat: number;
  lng: number;
  address?: string;
}

export type FieldErrors = Record<string, string | string[]>;

export class ApiError extends Error {
  status: number;
  errors?: FieldErrors;
  raw?: unknown;

  constructor(
    message: string,
    status: number,
    errors?: FieldErrors,
    raw?: unknown
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.raw = raw;
  }
}

export const isApiError = (err: unknown): err is ApiError =>
  typeof err === "object" &&
  err !== null &&
  "name" in (err as Record<string, unknown>) &&
  (err as { name?: unknown }).name === "ApiError";

export const toApiError = async (res: Response): Promise<ApiError> => {
  try {
    const data = await res.json();
    const message = data?.message || `HTTP ${res.status}`;
    const errors: FieldErrors | undefined = data?.errors;
    return new ApiError(message, res.status, errors, data);
  } catch {
    const text = await res.text().catch(() => "");
    return new ApiError(text || `HTTP ${res.status}`, res.status);
  }
};

export interface ReportDTO {
  id: number;
  title: string;
  description: string;
  category: CategoryDTO;
  images: string[];
  lat: number;
  long: number;
  status: ReportStatus;
  anonymous?: boolean;
  rejectedDescription?: string | null;
  createdBy: UserDTO;
  createdAt: Date;
}

export interface CategoryDTO {
  id: number;
  name: string;
}

export enum ReportStatus {
  PendingApproval = "PendingApproval",
  Assigned = "Assigned",
  InProgress = "InProgress",
  Suspended = "Suspended",
  Rejected = "Rejected",
  Resolved = "Resolved",
}

export interface UserDTO {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  image?: string | null;
  telegramUsername?: string | null;
  userType: string;
  emailNotificationsEnabled?: boolean;
  office?: string | null;
  createdAt: Date;
}
