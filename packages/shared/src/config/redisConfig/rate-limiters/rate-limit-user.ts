import { logger } from "../../../logger/logger";
import { fromIoredis, getIORedisClient, RateLimit } from "../../index.export";
import { buildKey } from "../cache-helper";
import { memoryUserRateLimiter } from "./memory-rate-limiter";

let redisDownUntil = 0;
export async function checkUser(userId: string, namespace: string, max: number = 10, windowSec: number = 60): Promise<{ allowed: boolean, remaining: number, retryAfterSec: number, userId: string, ip?: string }> {
    try {
        if (process.env.NODE_ENV !== "production") {
            return { allowed: true, remaining: max, retryAfterSec: 0, userId };
        }

        if (Date.now() < redisDownUntil) {
            // Use the per-instance counter
            logger.warn("Rate limiter unavailable, using fallback memory rate limiter", { redisDownUntil });
            return memoryUserRateLimiter(userId, namespace, max, windowSec);
        }
        // if (ip === 'unknown') logger.warn('OTP Helper: could not resolve client IP');
        console.log("This is the User Id of the User", userId)
        const isKey = userId //? `namespace:${ip}` : 'ip';
        const fullKey: string = buildKey(namespace, isKey); // Full key for rate limiter
        const limit = await RateLimit(fromIoredis(getIORedisClient(process.env.REDIS_URL)), { key: fullKey, max, windowSec },); // time this too 
        const t0 = Date.now();
        // const result = await getRedisClient().get(fullKey);         // time this
        // console.log('redis.get in check User function ', Date.now() - t0);
        return {
            allowed: limit.allowed,
            remaining: limit.remaining,
            retryAfterSec: limit.retryAfterSec,
            userId
        }
    } catch (error: unknown) {
        const message: string = error instanceof Error ? error.message : "Something went wrong, in check Ip for rate limiting helper"
        logger.error('Rate limiter unavailable, using fallback memory rate limiter', { error, message });
        redisDownUntil = Date.now() + 30_000;  ///30 seconds
        return memoryUserRateLimiter(userId, namespace, max, windowSec);
    }
}