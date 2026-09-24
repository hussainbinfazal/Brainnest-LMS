import { getRedisClient, logger } from "@repo/shared";
import { getClientIp } from "../getClientIp";
import { RateLimit } from "@repo/shared/config/redisConfig/rate-limiters/rate-limit";
import { buildKey } from "@repo/shared/config/redisConfig/cache-helper";

export async function checkIp(request: Request, namespace: string, key: string, max: number = 100, windowSec: number = 60): Promise<{ allowed: boolean, remaining: number, retryAfterSec: number }> {
    try {
        const ip = getClientIp(request.headers);
        if (ip === 'unknown') logger.warn('OTP Helper: could not resolve client IP');

        const fullKey: string = buildKey(namespace, key);
        const limit = await RateLimit(getRedisClient(), { key: fullKey, max, windowSec });
        return {
            allowed: limit.allowed,
            remaining: limit.remaining,
            retryAfterSec: limit.retryAfterSec
        }
    } catch (error: unknown) {
        const message: string = error instanceof Error ? error.message : "Something went wrong, in check Ip for rate limiting helper"
        logger.error('Rate limiter unavailable', { error, message });
        return {
            allowed: false,
            remaining: 0,
            retryAfterSec: 0
        }
    }
}