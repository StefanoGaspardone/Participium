import path from "path";

const BASE_URL = "/api";

export const CONFIG = {
  APP_PORT: parseInt(process.env.APP_PORT || "3000"),
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE: {
    TYPE: process.env.DB_TYPE || "postgres",
    HOST: process.env.DB_HOST || "localhost",
    PORT: parseInt(process.env.DB_PORT ?? "5439"),
    USERNAME: process.env.DB_USERNAME || "postgres",
    PASSWORD: process.env.DB_PASSWORD || "mysecretpassword",
    NAME: process.env.DB_NAME || "postgres",
    ENTITIES: [__dirname + "/../models/daos/*.{ts,js}"],
  },
  SWAGGER_FILE_PATH: path.join(__dirname, "../../docs/swagger.yaml"),
  ROUTES: {
    SWAGGER: `${BASE_URL}/docs`,
    CATEGORIES: `${BASE_URL}/categories`,
    UPLOADS: `${BASE_URL}/uploads`,
    REPORTS: `${BASE_URL}/reports`,
    USERS: `${BASE_URL}/users`,
    OFFICES: `${BASE_URL}/offices`,
  },
  LOG: {
    LEVEL: process.env.LOG_LEVEL || "info",
    PATH: process.env.LOG_PATH || "logs",
    ERROR_FILE: process.env.ERROR_LOG_FILE || "error.log",
    COMBINED_FILE: process.env.COMBINED_LOG_FILE || "combined.log",
  },
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "dhzr4djkx",
    API_KEY: process.env.CLOUDINARY_API_KEY || "345159419611275",
    API_SECRET:
      process.env.CLOUDINARY_API_SECRET || "Ni4c_gMnqrAUhoYj0GFtuRpCAm4",
    DEFAULT_FOLDER: process.env.CLOUDINARY_DEFAULT_FOLDER || "participium",
    UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET || "participium_preset",
  },
  TURIN: {
    MIN_LAT: parseFloat(process.env.TURIN_MIN_LAT || "45.000"),
    MAX_LAT: parseFloat(process.env.TURIN_MAX_LAT || "45.150"),
    MIN_LONG: parseFloat(process.env.TURIN_MIN_LONG || "7.550"),
    MAX_LONG: parseFloat(process.env.TURIN_MAX_LONG || "7.800"),
  },
  JWT_SECRET: process.env.JWT_SECRET || 'powerPuffGirls',
    TELEGRAM: {
      BOT_API_TOKEN: process.env.TELEGRAM_BOT_API_TOKEN || '7714201933:AAHzlmE5AWN3o1WirpDuc4H318NUb7WHFM4',
      SESSION_JSON_PATH: path.join(__dirname, '../telegram/session_db.json'),
    },
};
