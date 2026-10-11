import { logger } from "../../../logger/logger";
import { getClientIp } from "../../../utils/getClientIp";
import { buildKey } from "../cache-helper";
import { fromIoredis, RateLimit } from "./rate-limit";
import { getIORedisClient } from "../queue";
import type { RequestHeaders } from "../../../utils/getClientIp";
import { memoryIpRateLimiter } from "./memory-rate-limiter";

// Timestamp (ms) until which we skip Redis and use memory only
let redisDownUntil = 0;
export async function checkIp(request: { headers: RequestHeaders }, namespace: string, max: number = 10, windowSec: number = 60): Promise<{ allowed: boolean, remaining: number, retryAfterSec: number, ip: string }> {

    const ip = getClientIp(request.headers);
    // if (ip === 'unknown') logger.warn('OTP Helper: could not resolve client IP');
    // console.log("This is the IP of the User", ip)
    const isKey = ip //? `ip:${ip}` : 'ip';
    // Local development: skip the limiter so dev traffic never uses Redis quota
    // if (process.env.NODE_ENV !== "production") {
    //     // Allow the request with no wait time
    //     return { allowed: true, remaining: max, retryAfterSec: 0, ip };
    // }
    // Circuit breaker: Redis failed recently, so go straight to memory
    if (Date.now() < redisDownUntil) {
        // Use the per-instance counter
        return memoryIpRateLimiter(request, namespace, max, windowSec);
    }
    try {
        const fullKey: string = buildKey(namespace, isKey); // Full key for rate limiter
        if (process.env.NODE_ENV !== "production") {
            // Pretend the request is allowed with no wait time
        }
        const limit = await RateLimit(fromIoredis(getIORedisClient(process.env.REDIS_URL)), { key: fullKey, max, windowSec },); // time this too 
        const t0 = Date.now();
        // const result = await getRedisClient().get(fullKey);         // time this
        // console.log('redis.get in check IP function ', Date.now() - t0);
        return {
            allowed: limit.allowed,
            remaining: limit.remaining,
            retryAfterSec: limit.retryAfterSec,
            ip
        }
    } catch (error: unknown) {

        const message: string = error instanceof Error ? error.message : "Something went wrong, in check Ip for rate limiting helper"
        logger.error('Rate limiter unavailable, using memory fallback', { error, message });
        redisDownUntil = Date.now() + 30_000;  ///30 seconds
        return memoryIpRateLimiter(request, namespace, max, windowSec)
    }
}
