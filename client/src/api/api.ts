import type { Category, Office, User } from "../models/models";
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
): Promise<{ message: string }> => {
  const res = await fetch(`${BASE_URL}/users/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw await toApiError(res);
  }

  return res.json();
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
  officeId?: number;
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
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to create employee: ${res.status} ${text}`);
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

