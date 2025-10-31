import { CONFIG } from '@config';
import winston from 'winston';

const logger = winston.createLogger({
    level: CONFIG.LOG.LEVEL,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(
            ({ level, message, timestamp }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`
        )
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: `${CONFIG.LOG.PATH}/${CONFIG.LOG.ERROR_FILE}`,
            level: 'error'
        }),
        new winston.transports.File({
            filename: `${CONFIG.LOG.PATH}/${CONFIG.LOG.COMBINED_FILE}`
        })
    ]
});

export const logInfo = (message: string) => logger.info(message);
export const logWarn = (message: string) => logger.warn(message);
export const logError = (message: string, error?: any) =>  logger.error(`${message} ${error && `\nStack: ${error.stack}`}`);
export const logDebug = (message: string) => logger.debug(message);