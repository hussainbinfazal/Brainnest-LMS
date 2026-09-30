import { getRedisClient } from "../cache";
import { buildKey } from "../cache-helper";

const redisClient: ReturnType<typeof getRedisClient> = getRedisClient(); //// globalThis.__redisClient
export async function acquireSlot(key: string, id: string, max: number, ttlSec: number): Promise<boolean> {

    const now: number = Date.now();
    const res = await redisClient
        .multi() /// Batch commands
        .zremrangebyscore(key, 0, now - ttlSec * 1000) /// remove expired keys
        .zadd(key, { score: now, member: id }) /// add new key
        .zcard(key) //// count active keys 
        .expire(key, ttlSec) /// set ttl
        .exec<[number, number | null, number, number]>(); /// get results

    if (res[2] > max) { // too many keys
        await redisClient.zrem(key, id); // roll back our own add
        return false;
    }
    return true; ///Success means session is available for this key till now
}

export const releaseSlot = (key: string, id: string) => {
    redisClient.zrem(key, id);
}





///This is how to use this in project (routes)
// const ok = await acquireSlot(buildKey("ai-stream:active", userId), requestId, 2, 300);
// if (!ok) return failResponse("Finish your current request first.", 429, "QUOTA_EXCEEDED");
// try {
//   // ... do the work
// } finally {
//   await releaseSlot(buildKey("ai-stream:active", userId), requestId); // always runs, even on error
// }