import 'dotenv/config';
import 'reflect-metadata';
import { closeDatabase, initializeDatabase } from '@database';
import { logError, logInfo } from '@utils/logger';
import { Server } from 'http';
import { app } from '@app';
import { CONFIG } from '@config';

let server: Server;

const startServer = async () => {
    try {
        await initializeDatabase();
        server = app.listen(CONFIG.APP_PORT, () => {
            logInfo(`[APP INIT] Server listening on http://localhost:${CONFIG.APP_PORT}`);
            logInfo(`[APP INIT] Swagger UI available at http://localhost:${CONFIG.APP_PORT}${CONFIG.ROUTES.SWAGGER}`);
        });
    } catch(error) {
        logError('[APP INIT] Error in app initialization:', error);
        process.exit(1);
    }
}

const closeServer = (): Promise<void> => {
    if(server) return new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    return Promise.resolve();
}

async function shutdown() {
    await closeServer();
    logInfo('[APP CLOSE] Shutdown complete');

    await closeDatabase();

    process.exit(0);
}

startServer();

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);