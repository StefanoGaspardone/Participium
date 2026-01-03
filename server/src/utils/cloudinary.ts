import { CONFIG } from '@config';
import { BadRequestError } from '@errors/BadRequestError';
import crypto from 'node:crypto';

export type CloudinaryConfig =  {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    uploadPreset: string;
    defaultFolder: string;
}

export const getCloudinaryConfig = (): CloudinaryConfig => {
    const cloudName = CONFIG.CLOUDINARY.CLOUD_NAME;
    const apiKey = CONFIG.CLOUDINARY.API_KEY;
    const apiSecret = CONFIG.CLOUDINARY.API_SECRET;
    const uploadPreset = CONFIG.CLOUDINARY.UPLOAD_PRESET;
    const defaultFolder = CONFIG.CLOUDINARY.DEFAULT_FOLDER;

    if(!cloudName || !apiKey || !apiSecret) throw new BadRequestError('Cloudinary env vars missing: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');

    return { 
        cloudName, 
        apiKey, 
        apiSecret, 
        uploadPreset, 
        defaultFolder
    };
}

export const signParams = (params: Record<string, string | number>, apiSecret: string): string => {
    const toSign = Object.keys(params)
        .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '')
        .sort((a, b) => a.localeCompare(b))
        .map(k => `${k}=${params[k]}`)
        .join('&');

    return crypto.createHash('sha1')
        .update(toSign + apiSecret)
        .digest('hex');
}