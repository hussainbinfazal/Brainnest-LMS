import { Redis as UpstashRedis } from "@upstash/redis";
import { logger } from "../../logger/logger";

declare global {
    var __redisClient: UpstashRedis | undefined
}

// let redisClient: UpstashRedis | null = null;
export function initializeRedis(client: UpstashRedis) {
    globalThis.__redisClient = client;
    // redisClient = client;
    logger.info("Upstash Redis connected");
}

export function getRedisClient() {
    if (!globalThis.__redisClient) {
        // if (!redisClient) {
        const url: string = process.env.UPSTASH_REDIS_URL!;
        const token: string = process.env.UPSTASH_REDIS_TOKEN!;

        if (!url || !token) {
            logger.error("Redis environment variables are missing", {
                urlConfigured: Boolean(url),
                tokenConfigured: Boolean(token),
            });
            throw new Error("Missing UPSTASH_REDIS_URL or UPSTASH_REDIS_TOKEN.");
        }

        logger.warn("Redis client missing on globalThis,constructing fallback from env");
        // redisClient = new UpstashRedis({ url, token });
        globalThis.__redisClient = new UpstashRedis({ url, token });
    }

    // return redisClient;
    return globalThis.__redisClient;
}

// export const redisClient = new UpstashRedis({
//     url: process.env.UPSTASH_REDIS_URL,
//     token: process.env.UPSTASH_REDIS_TOKEN
// })

// logger.info("Upstash Redis connected")


export type RedisFailure = 'quota' | 'auth' | 'network' | 'unknown';


///Simplify redis failure
export function classifyRedisFailureError(err: unknown): RedisFailure {
    const message = (err instanceof Error ? err.message : String(err)).toLowerCase();
    //Network error code
    const code = String((err as { code?: string })?.code ?? '').toUpperCase();

    //Quota limit
    if (/max (daily )?request|request limit|quota|max data size| max request size| oom command not allowed/.test(message)) return 'quota';
    //Credentials Error
    if (/wrongpass|noauth|unauthorized|invalid token/.test(message)) return 'auth'

    ///No response, netwrok code
    if (['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'].includes(code) || /fetch failed|timeout|network|socket/.test(message))
        return 'network'
    return "unknown"
}

//Timestamp until which we skip redis
let redisDownUntil = 0;

export function markRedisDownFailure(err: unknown): void {
    ///Decide what the kind of failure this is 
    const kind = classifyRedisFailureError(err);
    //Quota: back off for 10 minutes, since retrying cannot succeded and may burn commands
    ///Network: 30 seconds, since outages are usually short
    ///Auth/unknown: 60 seconds, and the log below tells you to go look
    const backoffMs = kind === 'quota' ? 10 * 60 * 1000 : kind === 'network' ? 30 * 1000 : 60 * 1000;
    ///Skip redis untill then
    redisDownUntil = Date.now() + backoffMs;
    //Log the kind AND the raw message
    logger.error('Redis failed', { kind, message: err instanceof Error ? err.message : String(err), backoffMs });
};


export const redisIsDown = () => Date.now() < redisDownUntil;

