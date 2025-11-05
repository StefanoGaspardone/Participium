import type { Category } from "../models/models";
import { toApiError } from "../models/models";

const BASE_URL = 'http://localhost:3000/api';

export interface CreateReportPayload {
	title: string;
	description: string;
	categoryId: number;
	images: string[];
	lat: number;
	long: number;
	anonymous: boolean;
}

type CategoriesResponse = { 
    categories: Category[] 
};

export const getCategories = async (): Promise<Category[]> => {
	const res = await fetch(`${BASE_URL}/categories`, { method: 'GET' });
	if(!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(`Failed to fetch categories: ${res.status} ${text}`);
	}

	const data: CategoriesResponse = await res.json();
	return data.categories ?? [];
};

export const createReport = async (payload: CreateReportPayload): Promise<{ message: string }> => {
	const res = await fetch(`${BASE_URL}/reports`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ payload }),
	});

	if(!res.ok) {
		throw await toApiError(res);
	}
	return res.json();
}

type UploadSignResponse = {
	cloudName: string;
	apiKey: string;
	timestamp: number;
	defaultFolder?: string;
	uploadPreset?: string;
	signature: string;
}

type CloudinaryUploadResponse = {
	secure_url?: string;
	url?: string;
	public_id?: string;
}

export const uploadImages = async (image: File): Promise<string> => {
	const signRes = await fetch(`${BASE_URL}/uploads/sign`, { method: 'POST' });
	if(!signRes.ok) {
		const text = await signRes.text().catch(() => '');
		throw new Error(`Failed to sign upload: ${signRes.status} ${text}`);
	}

	const sign: UploadSignResponse = await signRes.json();

	const form = new FormData();
	form.append('file', image);
	form.append('api_key', sign.apiKey);
	form.append('timestamp', String(sign.timestamp));
	form.append('signature', sign.signature);

	if(sign.defaultFolder) form.append('folder', sign.defaultFolder);
	if(sign.uploadPreset) form.append('upload_preset', sign.uploadPreset);

	const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`;
	const cloudRes = await fetch(cloudinaryUrl, {
		method: 'POST',
		body: form,
	});
	
    if(!cloudRes.ok) {
		const text = await cloudRes.text().catch(() => '');
		throw new Error(`Cloudinary upload failed: ${cloudRes.status} ${text}`);
	}

	const cloudData: CloudinaryUploadResponse = await cloudRes.json();
	const url = cloudData.secure_url || cloudData.url;
	
    if(!url) throw new Error('Cloudinary did not return a URL');
	return url;
}