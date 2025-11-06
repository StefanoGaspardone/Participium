import { CONFIG } from "@config";
import { logError, logInfo } from "@utils/logger";
import { DataSource } from "typeorm";

const databaseUrl = process.env.DATABASE_URL;
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || CONFIG.DATABASE.HOST || "localhost",
  port: Number(process.env.DB_PORT) || CONFIG.DATABASE.PORT,
  username: process.env.DB_USERNAME || CONFIG.DATABASE.USERNAME,
  password: process.env.DB_PASSWORD || CONFIG.DATABASE.PASSWORD,
  synchronize: true,
  entities: CONFIG.DATABASE.ENTITIES,
  logging: false
});

export const initializeDatabase = async () => {
  try {
    console.log(`host == ${process.env.DB_HOST}; port: ${Number(process.env.DB_PORT)}; ,
  username: ${process.env.DB_USERNAME},
  password: ${process.env.DB_PASSWORD},
  entities: ${CONFIG.DATABASE.ENTITIES} `);
    await AppDataSource.initialize();
    logInfo("[DB INIT] Database initialize and connected");
  } catch (error: any) {
    logError("[DB INIT] Error while initializing database:", error);

    try {
      if (error && Array.isArray((error as any).errors)) {
        for (const e of (error as any).errors)
          logError("[DB INIT] Inner error:", e);
      }
    } catch (inner) {}

    throw error;
  }
};

export const closeDatabase = async () => {
  try {
    await AppDataSource.destroy();
    logInfo("[DB INIT] Database connection closed");
  } catch (error) {
    logError("[DB INIT] Error while closing database:", error);
  }
};
