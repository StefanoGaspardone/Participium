import { CONFIG } from '@config';
import { logError, logInfo } from '@utils/logger';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
    type: CONFIG.DATABASE.TYPE as any,
    database: CONFIG.DATABASE.NAME,
    entities: CONFIG.DATABASE.ENTITIES,
    synchronize: true,
    logging: false,
    host: CONFIG.DATABASE.HOST,
    port: CONFIG.DATABASE.PORT,
    username: CONFIG.DATABASE.USERNAME,
    password: CONFIG.DATABASE.PASSWORD,
});

export const initializeDatabase = async () => {
    try {
        await AppDataSource.initialize();
        logInfo('[DB INIT] Database initialize and connected');
    } catch (error: any) {
        logError('[DB INIT] Error while initializing database:', error);

        try {
            if(error && Array.isArray((error as any).errors)) {
                for(const e of (error as any).errors) logError('[DB INIT] Inner error:', e);
            }
        } catch(inner) {}

        throw error;
    }
}

export const closeDatabase = async () => {
    try {
        await AppDataSource.destroy();
        logInfo('[DB INIT] Database connection closed');
    } catch(error) {
        logError('[DB INIT] Error while closing database:', error);
    }
}