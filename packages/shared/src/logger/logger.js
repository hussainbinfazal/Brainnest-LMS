import pino from 'pino';
const isProduction = process.env.NODE_ENVIRONMENT === 'production';
export const logger = pino({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
}, isProduction ? undefined : pino.transport({
    target: 'pino-pretty',
    options: {
        colorize: true,
        translateTime: "HH:MM;ss",
        ignore: 'pid,hostname'
    }
}));
