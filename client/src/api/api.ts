import type { Category, Chat, Company, Message, Office, Report, User } from "../models/models";
import { toApiError } from "../models/models";

const BASE_URL = "http://localhost:3000/api";

const getToken = () => localStorage.getItem('token');

export interface CreateReportPayload {
  title: string;
  description: string;
  categoryId: number;
  images: string[];
  lat: number;
  long: number;
  anonymous: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  image?: string | null;
  telegramUsername?: string | null;
  emailNotificationsEnabled: boolean;
}

export interface LoginPayload {
  username: string;
  password: string;
}

type CategoriesResponse = {
  categories: Category[];
};

type OfficeResponse = {
  offices: Office[];
};

export const getCategories = async (): Promise<Category[]> => {
  const res = await fetch(`${BASE_URL}/categories`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch categories: ${res.status} ${text}`);
  }

  const data: CategoriesResponse = await res.json();
  return data.categories ?? [];
};

export const createReport = async (
  payload: CreateReportPayload
): Promise<{ message: string }> => {
  const res = await fetch(`${BASE_URL}/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ payload }),
  });

  if (!res.ok) {
    throw await toApiError(res);
  }
  return res.json();
};

type UploadSignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  defaultFolder?: string;
  uploadPreset?: string;
  signature: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  url?: string;
  public_id?: string;
};

export const uploadImages = async (image: File): Promise<string> => {
  const signRes = await fetch(`${BASE_URL}/uploads/sign`, { method: "POST" });
  if (!signRes.ok) {
    const text = await signRes.text().catch(() => "");
    throw new Error(`Failed to sign upload: ${signRes.status} ${text}`);
  }

  const sign: UploadSignResponse = await signRes.json();

  const form = new FormData();
  form.append("file", image);
  form.append("api_key", sign.apiKey);
  form.append("timestamp", String(sign.timestamp));
  form.append("signature", sign.signature);

  if (sign.defaultFolder) form.append("folder", sign.defaultFolder);
  if (sign.uploadPreset) form.append("upload_preset", sign.uploadPreset);

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`;
  const cloudRes = await fetch(cloudinaryUrl, {
    method: "POST",
    body: form,
  });

  if (!cloudRes.ok) {
    const text = await cloudRes.text().catch(() => "");
    throw new Error(`Cloudinary upload failed: ${cloudRes.status} ${text}`);
  }

  const cloudData: CloudinaryUploadResponse = await cloudRes.json();
  const url = cloudData.secure_url || cloudData.url;

  if (!url) throw new Error("Cloudinary did not return a URL");
  return url;
};

export const registerUser = async (
  payload: RegisterPayload
) => {
  const res = await fetch(`${BASE_URL}/users/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw await toApiError(res);
  }
};

export const loginUser = async (
  payload: LoginPayload
): Promise<{ token: string }> => {
  const res = await fetch(`${BASE_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw await toApiError(res);
  }

  return res.json();
};

export const createEmployee = async (payload: {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  userType: string;
  officeIds?: number[];
  companyId?: number;
}): Promise<{ message: string }> => {
  const res = await fetch(`${BASE_URL}/users/employees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw await toApiError(res);
  }

  return res.json();
};

export const me = async (): Promise<{ token: string }> => {
  const res = await fetch(`${BASE_URL}/users/me`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  if (!res.ok) {
    throw await toApiError(res);
  }

  return res.json();
}

export const getOffices = async (): Promise<Office[]> => {
  const token = getToken();

  if (!token) {
    throw new Error("Missing authentication token");
  }

  const res = await fetch(`${BASE_URL}/offices`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch offices: ${res.status} ${text}`);
  }

  let data: OfficeResponse;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid JSON in /offices response");
  }

  const officesArray =
    Array.isArray(data)
      ? data
      : Array.isArray(data.offices)
        ? data.offices
        : [];

  if (!Array.isArray(officesArray)) {
    console.error("Unexpected /offices response format:", data);
    throw new Error("Unexpected response format from /offices");
  }

  const offices: Office[] = officesArray.map((office) => ({
    id: Number(office.id),
    name: String(office.name),
    ...office,
  }));

  return offices;
};

// Reports management (PRO homepage)
export const getReportsByStatus = async (status: string): Promise<Report[]> => {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/reports?status=${encodeURIComponent(status)}`, {
    method: 'GET',
    headers,
  });
  if (!res.ok) throw await toApiError(res);
  const data = await res.json();
  const reports: Report[] = Array.isArray(data?.reports) ? data.reports : [];
  return reports.map(r => ({
    ...r,
    createdAt: r.createdAt,
    category: r.category,
    images: Array.isArray(r.images) ? r.images : [],
  }));
};

export const updateReportCategory = async (reportId: number, categoryId: number): Promise<Report> => {
  const res = await fetch(`${BASE_URL}/reports/${reportId}/category`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ categoryId })
  });
  if (!res.ok) throw await toApiError(res);
  const data = await res.json();
  return data.report as Report;
};
export interface AssignOrRejectResponse {
  report: Report,
  message: string
}
export const assignOrRejectReport = async (reportId: number, status: 'Assigned' | 'Rejected', rejectedDescription?: string): Promise<AssignOrRejectResponse> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = { status };
  if (status === 'Rejected') body.rejectedDescription = rejectedDescription;
  const res = await fetch(`${BASE_URL}/reports/${reportId}/status/public`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw await toApiError(res);
  return await res.json();
};

interface StatusUpdatePayload {
  status: "InProgress" | "Suspended" | "Resolved";
}
export const updateReportStatus = async (reportId: number, status: "InProgress" | "Suspended" | "Resolved",): Promise<Report> => {
  const body: StatusUpdatePayload = { status };
  const res = await fetch(`${BASE_URL}/reports/${reportId}/status/technical`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw await toApiError(res);
  const data = await res.json();
  return data.report as Report;
};

export const getAssignedReports = async (): Promise<Report[]> => {
  const res = await fetch(`${BASE_URL}/reports/assigned`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  if (!res.ok) throw await toApiError(res);
  const data = await res.json();
  const reports: Report[] = Array.isArray(data?.reports) ? data.reports : [];
  return reports.map(r => ({
    ...r,
    createdAt: r.createdAt,
    category: r.category,
    images: Array.isArray(r.images) ? r.images : [],
    assignedTo: r.assignedTo ?? null,
  }));
};
export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  image?: string | null;
  telegramUsername?: string | null;
  emailNotificationsEnabled?: boolean;
}

export const updateUser = async (
  payload: UpdateUserPayload
): Promise<{ message: string; user: User }> => {
  const res = await fetch(`${BASE_URL}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw await toApiError(res);
  }

  return res.json();
};

export interface Notification {
  id: number;
  previousStatus?: string | null;
  newStatus?: string | null;
  seen: boolean;
  createdAt: string;
  report: {
    id: number;
    title: string;
  };
  type?: string | null;
  message?: {
    id: number;
    text: string;
    sentAt: string;
    senderId?: number;
    senderRole?: string;
  } | null;
}
type NotificationsResponse = {
  notifications: Notification[];
}
export const getMyNotifications = async (): Promise<Notification[]> => {
  const res = await fetch(`${BASE_URL}/notifications/my`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  if (!res.ok) {
    throw await toApiError(res);
  }

  let data: NotificationsResponse;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid JSON in /offices response");
  }

  return Array.isArray(data.notifications) ? data.notifications : [];
}

export const markNotificationAsSeen = async (id: number) => {
  const res = await fetch(`${BASE_URL}/notifications/seen/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    }
  });

  if (!res.ok) {
    throw await toApiError(res);
  }
}

/** CODE for REGISTRATION ******************************************************************************************************* */

interface CodeConfirm {
  payload: {
    username: string;
    code: string;
  }
}

export const validateUser = async (payload: CodeConfirm) => {
  const res = await fetch(`${BASE_URL}/users/validate-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw await toApiError(res);
  }
}

export interface ResendCode {
  username: string;
}

export const resendCode = async (payload: ResendCode) => {
  const res = await fetch(`${BASE_URL}/users/resend-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw await toApiError(res);
  }
  if (!res.ok) {
    throw await toApiError(res);
  }
}


/* CHATs & MESSAGEs  ****************************************************************************************************************************/

type ChatsResponse = {
  chats: Chat[];
}

export const getUserChats = async (): Promise<Chat[]> => {
  const res = await fetch(`${BASE_URL}/chats`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!res.ok) throw await toApiError(res);
  let data: ChatsResponse;
  try {
    data = await res.json();
    console.log("RAW RECEIVED : ", JSON.stringify(data));
  } catch {
    throw new Error("Failed to fetch your chats");
  }

  const chatsArray =
    Array.isArray(data)
      ? data
      : Array.isArray(data.chats)
        ? data.chats
        : [];

  return chatsArray;
}

export const getChatMessages = async (chatId: number): Promise<Message[]> => {
  const res = await fetch(`${BASE_URL}/chats/${chatId}/messages`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  if (!res.ok) { console.log("PROBLEM"); throw await toApiError(res); }


  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Failed to fetch your chats");
  }

  const chatsArray = data.chats;
  return chatsArray;
}

export interface SendMessage {
  receiverId: number,
  text: string,
}

export const sendMessage = async (chatId: number, payload: SendMessage) => {
  const res = await fetch(`${BASE_URL}/chats/${chatId}/newMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw await toApiError(res);
  }
}

export interface CreateChatPayload {
  secondUserId: number,
  reportId: number
}

export const createChat = async (payload: CreateChatPayload) => {
  const res = await fetch(`${BASE_URL}/chats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw await toApiError(res);
  }
}


/* COMPANIES  ****************************************************************************************************************************/

export const createCompany = async (payload: Company) => {
  const res = await fetch(`${BASE_URL}/companies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw await toApiError(res);
  }
}

export const getAllCompanies = async (): Promise<Company[]> => {
  const res = await fetch(`${BASE_URL}/companies`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  if (!res.ok) {
    throw await toApiError(res);
  }

  const data = await res.json();
  const companies: Company[] = Array.isArray(data) ? data : Array.isArray(data?.companies) ? data.companies : [];
  return companies.filter(company => Number(company?.id) !== 3);
}

// External Maintainers
export const getExternalMaintainers = async (categoryId: number): Promise<User[]> => {
  const res = await fetch(`${BASE_URL}/users/maintainers?categoryId=${encodeURIComponent(categoryId)}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });

  if (!res.ok) throw await toApiError(res);

  const data = await res.json();
  const users: User[] = Array.isArray(data) ? data : [];
  return users;
};

export const assignReportToExternalMaintainer = async (reportId: number, maintainerId: number): Promise<Report> => {
  const res = await fetch(`${BASE_URL}/reports/${reportId}/assign-external`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ maintainerId })
  });

  if (!res.ok) throw await toApiError(res);

  const data = await res.json();
  return data as Report;
};

// Technical Staff Members (TSM) endpoints
export interface TechnicalStaffMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  userType: string;
  offices: string[]; // array of office names
}

/**
 * GET /users/tsm
 * Returns an array of technical staff members with their assigned office names
 */
export const getTechnicalStaffMembers = async (): Promise<TechnicalStaffMember[]> => {
  const res = await fetch(`${BASE_URL}/users/tsm`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!res.ok) throw await toApiError(res);

  const data = await res.json();
  const arr = Array.isArray(data) ? data : Array.isArray(data?.tsm) ? data.tsm : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return arr.map((t: any) => ({
    id: Number(t.id),
    firstName: String(t.firstName ?? ""),
    lastName: String(t.lastName ?? ""),
    email: String(t.email ?? ""),
    username: String(t.username ?? ""),
    userType: String(t.userType ?? ""),
    offices: Array.isArray(t.offices) ? t.offices.map(String) : [],
  }));
};

/**
 * Convenience helper: return the offices for a single TSM by id.
 * Implemented locally by using `getTechnicalStaffMembers` (server doesn't expose /users/tsm/{id}).
 */
export const getTsmOffices = async (tsmId: number): Promise<string[]> => {
  const all = await getTechnicalStaffMembers();
  const t = Array.isArray(all) ? all.find((s) => Number(s.id) === Number(tsmId)) : null;
  return t?.offices ?? [];
};

/**
 * PATCH /users/tsm/{id}
 * Body: { officeIds: number[] }
 */
export const updateTsmOffices = async (tsmId: number, officeIds: number[]): Promise<{ message?: string; updatedTsm?: any }> => {
  const res = await fetch(`${BASE_URL}/users/tsm/${tsmId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ officeIds }),
  });

  if (!res.ok) throw await toApiError(res);

  return res.json();
};