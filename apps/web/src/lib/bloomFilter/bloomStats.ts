import { getRedisClient } from "@repo/shared";
import { logger } from "@repo/shared";

const STATS_TOTAL_KEY = "bloom:stats:total";
const STATS_FALLBACK_KEY = "bloom:stats:active";

//  Call once per check - username request, after calling bloomMightContain.
//  * `fellThrough` = the value bloomMightContain returned(true = had to hit Mongo).
//  * Fire - and - forget — stats accuracy isn't worth blocking the request on.



export function recordBloomCheck(fellthrough: boolean): void {
    const redisClient: ReturnType<typeof getRedisClient> = getRedisClient();
    const pipeline: ReturnType<ReturnType<typeof getRedisClient>["pipeline"]> = redisClient.pipeline().incr(STATS_TOTAL_KEY);
    if (!fellthrough) pipeline.incr(STATS_FALLBACK_KEY);
    pipeline.exec().catch((error: unknown) => logger.error(`[bloom] recordBloomCheck failed:`, { error }));
};

export async function getBloomStats(): Promise<{ total: number; fallback: number, fallbackRate: number }> {
    const redisClient: ReturnType<typeof getRedisClient> = getRedisClient();
    const [total, fallback] = await Promise.all([
        redisClient.get<number>(STATS_TOTAL_KEY),
        redisClient.get<number>(STATS_FALLBACK_KEY),
    ]);

    const t = total ?? 0;
    const f = fallback ?? 0;
    return { total: t, fallback: f, fallbackRate: t === 0 ? 0 : f / t };
};


 //Call after a resize/rebuild so the ratio reflects the new filter, not the old one.
export async function resetBloomStats(): Promise<void> {
    const redisClient: ReturnType<typeof getRedisClient> = getRedisClient();
    await redisClient.pipeline().del(STATS_TOTAL_KEY).del(STATS_FALLBACK_KEY).exec();
}

