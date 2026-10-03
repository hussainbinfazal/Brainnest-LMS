import { getIORedisClient } from "../queue";

export async function acquireSlot(key: string, id: string, max: number, ttlSec: number): Promise<boolean> {
    const redisClient = getIORedisClient(process.env.REDIS_URL);
    const now: number = Date.now();
    const results = await redisClient
        .multi() /// Batch commands
        .zremrangebyscore(key, 0, now - ttlSec * 1000) /// remove expired keys
        .zadd(key, now, id) /// add new key
        .zcard(key) //// count active keys 
        .expire(key, ttlSec) /// set ttl
        .exec();

    if (!results) throw new Error("Redis transaction returned no results");
    for (const [error] of results) {
        if (error) throw error;
    }

    const activeCount = results[2]?.[1];
    if (typeof activeCount !== "number") {
        throw new Error("Redis transaction returned an invalid active session count");
    }

    if (activeCount > max) { // too many keys
        await redisClient.zrem(key, id); // roll back our own add
        return false;
    }
    return true; ///Success means session is available for this key till now
}

export const releaseSlot = async (key: string, id: string): Promise<number> => {
    const redisClient = getIORedisClient(process.env.REDIS_URL);
    return redisClient.zrem(key, id);
}





///This is how to use this in project (routes)
// const ok = await acquireSlot(buildKey("ai-stream:active", userId), requestId, 2, 300);
// if (!ok) return failResponse("Finish your current request first.", 429, "QUOTA_EXCEEDED");
// try {
//   // ... do the work
// } finally {
//   await releaseSlot(buildKey("ai-stream:active", userId), requestId); // always runs, even on error
// }