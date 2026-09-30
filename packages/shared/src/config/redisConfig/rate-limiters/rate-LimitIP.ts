import { logger } from "../../../logger/logger";
import { getClientIp } from "../../../utils/getClientIp";
import { buildKey } from "../cache-helper";
import { fromIoredis, RateLimit } from "./rate-limit";
import { getIORedisClient } from "../queue";
import type { RequestHeaders } from "../../../utils/getClientIp";

export async function checkIp(request: { headers: RequestHeaders }, namespace: string, max: number = 10, windowSec: number = 60): Promise<{ allowed: boolean, remaining: number, retryAfterSec: number, ip: string }> {
    const ip = getClientIp(request.headers);
    try {
        // if (ip === 'unknown') logger.warn('OTP Helper: could not resolve client IP');
        console.log("This is the IP of the User", ip)
        const isKey = ip //? `ip:${ip}` : 'ip';
        const fullKey: string = buildKey(namespace, isKey); // Full key for rate limiter
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
        logger.error('Rate limiter unavailable', { error, message });
        return {
            allowed: false,
            remaining: 0,
            retryAfterSec: 0,
            ip
        }
    }
}
