
console.log("QUEUE.TS EVALUATED, cwd at this moment:", process.cwd());
import { logger } from "../../logger/logger";
import IORedis, { Redis as IORedisClient } from "ioredis";

declare global {
    var __ioredisConnection: IORedisClient | undefined
};

function createIORedisConnection(REDIS_URL?: string): IORedisClient {
    // console.log("RAW REDIS_URL PARAM:", REDIS_URL); // add this line

    if (!REDIS_URL) {
        throw new Error("Missing Redis environment variables")
    }
    const client = new IORedis(REDIS_URL!, {
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
// module-scoped singleton 
let _connection: IORedisClient | undefined;
export function getIORedisClient(REDIS_URL?: string): IORedisClient {

    if (globalThis.__ioredisConnection) {
        return globalThis.__ioredisConnection;
    }
    if (_connection) return _connection;
    _connection = createIORedisConnection(REDIS_URL);
    if (process.env.NODE_ENV !== 'production') {
        globalThis.__ioredisConnection = _connection
    }
    return _connection
}

if (process.env.NODE_ENV !== 'production') {
    globalThis.__ioredisConnection = _connection
}

export async function closeRedisConnections(): Promise<void> {
    const client = globalThis.__ioredisConnection ?? _connection;

    if (!client) return /// never connected, nothing to close

    await client.quit();

    globalThis.__ioredisConnection = undefined;

    _connection = undefined;
}


