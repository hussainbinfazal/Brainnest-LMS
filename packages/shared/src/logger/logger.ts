import pino from 'pino'

const isProduction = process.env.NODE_ENVIRONMENT === 'production';
export interface Ilogger {
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
    debug(message: string, meta?: Record<string, unknown>): void;
    fatal(message: string, meta?: Record<string, unknown>): void;
    trace(message: string, meta?: Record<string, unknown>): void;

}
const pinoInstance = pino(
    {
        level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    },
    isProduction ? undefined : pino.transport({
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: "HH:MM:ss", // also fixed below
            ignore: 'pid,hostname'
        }
    })
);
export const logger: Ilogger = {
    info: (message, meta) => pinoInstance.info(meta || {}, message),
    warn: (message, meta) => pinoInstance.warn(meta || {}, message),
    error: (message, meta) => pinoInstance.error(meta || {}, message),
    debug: (message, meta) => pinoInstance.debug(meta || {}, message),
    fatal: (message, meta) => pinoInstance.fatal(meta || {}, message),
    trace: (message, meta) => pinoInstance.trace(meta || {}, message),
}