import { logger } from "src/server";
import { fromIoredis, getIORedisClient, RateLimit } from "../../index.export";
import { buildKey } from "../cache-helper";

export async function checkUser(userId: string, namespace: string, max: number = 10, windowSec: number = 60): Promise<{ allowed: boolean, remaining: number, retryAfterSec: number, userId: string, ip?: string }> {
    try {
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
        logger.error('Rate limiter unavailable', { error, message });
        return {
            allowed: false,
            remaining: 0,
            retryAfterSec: 0,
            userId
        }
    }
}