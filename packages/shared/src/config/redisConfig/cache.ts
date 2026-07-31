import { Redis as UpstashRedis } from "@upstash/redis";
import { logger } from "../../logger/logger";

let redisClient: UpstashRedis | null = null;
export function initializeRedis(client: UpstashRedis) {
    redisClient = client;
}

export function getRedisClient() {
    if (!redisClient) {
        logger.error("Error in redis GetClient Function", {redisClient});
        throw new Error("Redis client has not been initialized.");
    }

    return redisClient;
}

// export const redisClient = new UpstashRedis({
//     url: process.env.UPSTASH_REDIS_URL,
//     token: process.env.UPSTASH_REDIS_TOKEN
// })

// logger.info("Upstash Redis connected")