import type Redis from 'ioredis';   // BullMQ already needs ioredis, so I assume you have it

export interface ScriptRunner {
    eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown>;
}
// Lua script implements an atomic Redis counter with automatic expiration, designed to prevent "orphaned keys" that persist indefinitely if the expiration command fails.
// Increments the counter
//  It retrieves the current Time-To-Live using PTTL (in milliseconds)
// count == 1: This is the first increment(a new key).
// ttl == -1: The key exists but has no expiration set.This specific logic acts as a self - healing mechanism to fix keys that lost their TTL due to network timeouts, Redis restarts, or deployment issues, ensuring they are not permanently locked or counted forever.
const SCRIPT = `
local count = redis.call('INCR', KEYS[1]) 
local ttl = redis.call('PTTL', KEYS[1])
if count == 1 or ttl == -1 then 
    redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return {count, ttlMs}
`

export interface RateLimitOptions {
    key: string, // e.g. "otp-send:ip:1.2.3.4"
    max: number,
    windowSec: number
};
export interface RateLimitResult {
    allowed: boolean,
    remaining: number,
    retryAfterSec: number
};


export async function RateLimit(
    runner: ScriptRunner,
    { key, max, windowSec }: RateLimitOptions,
    request?: Request,
): Promise<RateLimitResult> {
    const [count, ttl] = (await runner.eval(
        SCRIPT, [`rl:${key}`], [windowSec * 1000]
    )) as [number, number];


    return {
        allowed: count <= max,
        remaining: Math.max(0, max - count),
        retryAfterSec: Math.max(0, Math.ceil(ttl / 1000))
    }
}


export const fromIoredis = (r: Redis): ScriptRunner => ({
    eval: (script, keys, args) => r.eval(script, keys.length, ...keys, ...args),
});
