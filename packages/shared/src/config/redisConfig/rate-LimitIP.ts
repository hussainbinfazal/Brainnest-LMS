import { logger } from "src/logger/logger";
import { getClientIp } from "src/utils/getClientIp";
import { buildKey } from "./cache-helper";
import { RateLimit } from "./rate-limiters/rate-limit";
import { getRedisClient } from "./cache";
import type { RequestHeaders } from "../../utils/getClientIp";

export async function checkIp(request: { headers: RequestHeaders }, namespace: string, max: number = 10, windowSec: number = 60): Promise<{ allowed: boolean, remaining: number, retryAfterSec: number, ip: string }> {
    const ip = getClientIp(request.headers);
    try {
        if (ip === 'unknown') logger.warn('OTP Helper: could not resolve client IP');
        const isKey = ip
        const fullKey: string = buildKey(namespace, isKey);
        const limit = await RateLimit(getRedisClient(), { key: fullKey, max, windowSec });
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