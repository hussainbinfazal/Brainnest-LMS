import IORedis, { Redis as IORedisClient } from "ioredis";
import { logger } from "../../logger/logger";

declare global {
    var __ioredisConnection: IORedisClient | undefined
}

function createIORedisConnection(): IORedisClient {

    if (!process.env.REDIS_URL) {
        throw new Error("Missing Redis environment variables")
    }
    const client = new IORedis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy(times: number) {
            return Math.min(times * 200, 2000)
        },
        ...(process.env.NODE_ENV === "production" ? { tls: {} } : {}),
    })
    client.on('error', (err: unknown) => {
        logger.error('[ioredis] connection error:', { err });
    });
    client.on('connect', () => logger.info('[ioredis] connected'));
    return client
}

export const connection: IORedisClient = globalThis.__ioredisConnection ?? createIORedisConnection()
if (process.env.NODE_ENV !== 'production') {
    globalThis.__ioredisConnection = connection
}

export async function closeRedisConnections(): Promise<void> {
    await connection.quit()
}


