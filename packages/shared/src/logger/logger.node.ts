import pino from "pino";



const isProduction = process.env.NODE_ENV === 'production';
export interface Ilogger {
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
    debug(message: string, meta?: Record<string, unknown>): void;
    fatal(message: string, meta?: Record<string, unknown>): void;
    trace(message: string, meta?: Record<string, unknown>): void;

}

export const loggerInstance = pino({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    transport: isProduction ? {
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname"

        },
    } : undefined
})

export const nodeLogger: Ilogger = {
    info: (message, meta) => loggerInstance.info(meta || {}, message),
    warn: (message, meta) => loggerInstance.warn(meta || {}, message),
    error: (message, meta) => loggerInstance.error(meta || {}, message),
    debug: (message, meta) => loggerInstance.debug(meta || {}, message),
    fatal: (message, meta) => loggerInstance.fatal(meta || {}, message),
    trace: (message, meta) => loggerInstance.trace(meta || {}, message),
}