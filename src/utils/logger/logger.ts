import pino from 'pino'

const isProduction = process.env.NODE_ENVIRONMENT === 'production';
export interface Ilogger {
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;

}
export const logger: Ilogger = pino(
    {
        level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    },
    isProduction ? undefined : pino.transport({
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: "HH:MM;ss",
            ignore: 'pid,hostname'
        }
    }))