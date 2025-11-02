const BASE_URL = '/api';

export const CONFIG = {
    APP_PORT: parseInt(process.env.APP_PORT || '3000'),
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE: {
        TYPE: process.env.DB_TYPE || 'postgres',
        HOST: process.env.DB_HOST || 'db.sbeiphaapjtocgdhfeyy.supabase.co',
        PORT: parseInt(process.env.DB_PORT ?? '5432'),
        USERNAME: process.env.DB_USERNAME || 'postgres',
        PASSWORD: process.env.DB_PASSWORD || 'postgres',
        NAME: process.env.DB_NAME || 'participium_db',
        ENTITIES: [__dirname + '/../models/daos/*.{ts,js}'],
    },
    SWAGGER_FILE_PATH: '../../docs/swagger.yaml',
    ROUTES: {
        SWAGGER: `${BASE_URL}/docs`,
        CATEGORIES: `${BASE_URL}/categories`,
        UPLOADS: `${BASE_URL}/uploads`,
    },
    LOG: {
        LEVEL: process.env.LOG_LEVEL || 'info',
        PATH: process.env.LOG_PATH || 'logs',
        ERROR_FILE: process.env.ERROR_LOG_FILE || 'error.log',
        COMBINED_FILE: process.env.COMBINED_LOG_FILE || 'combined.log',
    },
    CLOUDINARY: {
        CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'dhzr4djkx',
        API_KEY: process.env.CLOUDINARY_API_KEY || '345159419611275',
        API_SECRET: process.env.CLOUDINARY_API_SECRET || 'Ni4c_gMnqrAUhoYj0GFtuRpCAm4',
        DEFAULT_FOLDER: process.env.CLOUDINARY_DEFAULT_FOLDER || 'participium',
        UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET || 'participium_preset',
    }
}