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