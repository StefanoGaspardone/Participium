import { getCloudinaryConfig, signParams } from '@utils/cloudinary'

export class UploadService {

    sign = async (): Promise<{}> => {
        const { cloudName, apiKey, apiSecret, uploadPreset, defaultFolder } = getCloudinaryConfig();
        const timestamp = Math.floor(Date.now() / 1000);

        const paramsToSign: Record<string, string | number> = { timestamp, defaultFolder };
        if(uploadPreset) paramsToSign.upload_preset = uploadPreset;

        const signature = signParams(paramsToSign, apiSecret);

        return {
            cloudName,
            apiKey,
            timestamp,
            defaultFolder,
            uploadPreset,
            signature,
        };
    }
}

export const uploadService = new UploadService();