import path from "path";
import fs from "fs";

const SECRET_BASE_PATH = "/run/secrets";

/**
 * This function reads the content of a secret of Docker Swarm mounted as a file.
 * @param secretName is the secret's name (it corresponds to the filename in 'production' environment
 * OR to the environment variable name in 'development')
 * @returns the content of the secret file OR of the environment variables 
 */
const getSecret = (secretName: string): string => {
  if (process.env.NODE_ENV !== "production") {
    // this is what is returned in development :
    if (process.env[secretName]) {
      return process.env[secretName];
    } else {
      throw new Error(`Unable to retrieve secret: ${secretName}.`);
    }
  }

  const secretPath = path.join(SECRET_BASE_PATH, secretName);

  try {
    // we arrive here ONLY in production :
    // we get the value from the secret file
    const secretValue = fs.readFileSync(secretPath, 'utf-8').trim();
    return secretValue;
  } catch (error) {
    console.error(error + "\n" + `Unable to retrieve secret: ${secretName} from ${secretPath}.`);
    throw error;
  }
}

/**
 * This function reads the content of a secret of Docker Swarm mounted as a file.
 * (same as getSecret, BUT it works for numeric values ONLY, such as ports)
 * @param secretName is the secret's name (it corresponds to the filename in 'production' environment
 * OR to the environment variable name in 'development')
 * @returns the content of the secret file OR of the environment variables
 */
const getSecretNumber = (secretName: string): number => {
  if (process.env.NODE_ENV !== "production") {
    // this is what is returned in development :
    if (process.env[secretName])
      return Number.parseInt(process.env[secretName]);
    else {
      throw new Error(`Unable to retrieve secret: ${secretName}.`);
    }
  }
  const secretPath = path.join(SECRET_BASE_PATH, secretName);
  try {
    // we arrive here ONLY in production :
    // we get the value from the secret file
    const secretValue = fs.readFileSync(secretPath, 'utf-8').trim();
    return Number.parseInt(secretValue);
  } catch (error) {
    console.error(error + "\n" + `Unable to retrieve secret: ${secretName} from ${secretPath}.`);
    throw error;
  }
}

const BASE_URL = "/api";

export const CONFIG = {
  APP_PORT: getSecretNumber("APP_PORT"),
  NODE_ENV: process.env.NODE_ENV,
  DATABASE: {
    TYPE: getSecret("DB_TYPE"),
    HOST: getSecret("DB_HOST"),
    PORT: getSecretNumber("DB_PORT"),
    USERNAME: getSecret("DB_USERNAME"),
    PASSWORD: getSecret("DB_PASSWORD"),
    NAME: getSecret("DB_NAME"),
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
    NOTIFICATIONS: `${BASE_URL}/notifications`,
    // MESSAGES: `${BASE_URL}/messages`, // messages logic is now moved into chat's one
    CHATS: `${BASE_URL}/chats`,
    COMPANIES: `${BASE_URL}/companies`
  },
  LOG: {
    LEVEL: getSecret("LOG_LEVEL"),
    PATH: getSecret("LOG_PATH"),
    ERROR_FILE: getSecret("ERROR_LOG_FILE"),
    COMBINED_FILE: getSecret("COMBINED_LOG_FILE"),
  },
  CLOUDINARY: {
    CLOUD_NAME: getSecret("CLOUDINARY_CLOUD_NAME"),
    API_KEY: getSecret("CLOUDINARY_API_KEY"),
    API_SECRET: getSecret("CLOUDINARY_API_SECRET"),
    DEFAULT_FOLDER: getSecret("CLOUDINARY_DEFAULT_FOLDER"),
    UPLOAD_PRESET: getSecret("CLOUDINARY_UPLOAD_PRESET"),
  },
  TURIN: {
    GEO_JSON_FILE_PATH: path.join(__dirname, '../../data/turin_geo.json'),
  },
  JWT_SECRET: getSecret("JWT_SECRET"),
  TELEGRAM: {
    BOT_API_TOKEN: getSecret("TELEGRAM_BOT_API_TOKEN"),
    SESSION_JSON_PATH: path.join(__dirname, '../telegram/session_db.json'),
  },
  MAIL: {
    SMTP_HOST: getSecret("SMTP_HOST"),
    SMTP_PORT: getSecretNumber("SMTP_PORT"),
    SMTP_USER: getSecret("SMTP_USER"),
    SMTP_PASS: getSecret("SMTP_PASS"),
    MAIL_FROM_ADDRESS: getSecret("MAIL_FROM_ADDRESS"),
    MAIL_FROM_NAME: getSecret("MAIL_FROM_NAME"),
  }
};
