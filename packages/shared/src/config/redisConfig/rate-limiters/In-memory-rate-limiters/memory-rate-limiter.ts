
//One counter per key: how many hits, and when the window ends

import { logger } from "../../../../logger/logger";
import { getClientIp, type RequestHeaders } from "../../../../utils/getClientIp";
import { buildKey } from "../../cache-helper";

type Entry = {
    //Requests seen in the current window
    count: number,
    //Timestamps (ms) when this window expires
    resetAt: number;
};
///Same shape

//// Fields every limiter returns, IP-based or user-based
export type RateLimitResult = {
    // False to block this request
    allowed: boolean;
    // Requests left in the current window
    remaining: number;
    // Seconds to wait before the next request
    retryAfterSec: number;
};

// IP limiter result: shared fields plus the IP that was counted
export type IpLimitResult = RateLimitResult & {
    // The IP address used as the rate-limit key
    ip: string;
};

// User limiter result: shared fields plus the user id
export type UserRateLimit = RateLimitResult & {
    // The user this limit was counted for
    userId: string;
};



const MAX_KEYS = 10_000


///Typed handle  to globalThis so we can park the Map there
const g = globalThis as unknown as { __memLimiter: Map<string, Entry> };

///Store the Map on globalThis so dev hot reload does not wipe it 
const store: Map<string, Entry> = (g.__memLimiter ??= new Map<string, Entry>());


///Remove the expired entries, and trim  oldest ones if still too big


function sweep(now: number): void {
    //Walk every stored key 

    for (const [key, entry] of store) {
        //Delete windows that are already ended
        if (entry.resetAt <= now) store.delete(key)

    };
    ///Trim the map if too big
    while (store.size > MAX_KEYS) {
        //First key in the Map is the oldest one
        const oldest = store.keys().next().value
        if (oldest === undefined) break;


        ///Remove the oldest key from the map from the iterator object of the map 
        store.delete(oldest);
    }
}



///Memory Rate limiter
/// The only place that counts hits
function hit(key: string, max: number, windowSec: number): RateLimitResult {
    // Current time in ms
    const now = Date.now();
    // Look up the counter for this key
    const existing = store.get(key);

    // No counter, or the old window ended: start a fresh one
    if (!existing || existing.resetAt <= now) {
        // Clean up only when the Map is full, which keeps the hot path cheap
        if (store.size >= MAX_KEYS) sweep(now);
        // The first request counts as 1, not 0
        store.set(key, { count: 1, resetAt: now + windowSec * 1000 });
        // Allowed, with the rest of the quota left
        return { allowed: true, remaining: max - 1, retryAfterSec: 0 };
    }

    // Same window: count this request
    existing.count++;

    // Over the limit: block and say how long to wait
    if (existing.count > max) {
        // Round up so the client never retries too early
        const retryAfterSec = Math.ceil((existing.resetAt - now) / 1000);
        if (existing.count === max + 1) {
            // Log once per window so a flood of blocked requests cannot flood the logs
            logger.warn("Memory rate limit exceeded", { key, max, windowSec, retryAfterSec });
        }
        // Blocked
        return { allowed: false, remaining: 0, retryAfterSec };
    }

    // Under the limit: allowed
    return { allowed: true, remaining: max - existing.count, retryAfterSec: 0 };
}

// IP limiter: the key is built from the client IP
export function memoryIpRateLimiter(
    // Only the headers are needed to find the IP
    request: { headers: RequestHeaders },
    // Namespace keeps IP keys separate from user keys
    namespace: string,
    // Max requests per window
    max: number = 10,
    // Window length in seconds
    windowSec: number = 60
): IpLimitResult {
    // Fall back to "unknown" instead of the string "undefined"
    const ip = String(getClientIp(request.headers) ?? "unknown");
    // Count the hit and attach the IP that was counted
    return { ...hit(buildKey(namespace, ip), max, windowSec), ip };
}

// User limiter: the key is built from the user id
export function memoryUserRateLimiter(
    // The authenticated user's id
    userId: string,
    // Namespace keeps user keys separate from IP keys
    namespace: string,
    // Max requests per window
    max: number = 10,
    // Window length in seconds
    windowSec: number = 60
): UserRateLimit {
    // Count the hit and attach the user id
    return { ...hit(buildKey(namespace, userId), max, windowSec), userId };
}