import { getRedisClient } from "@repo/shared";
import { logger } from "@repo/shared";



const META_KEY: string = "bloom:usernames:meta";
const CONFIG_CACHE_TTL_MS: number = 5 * 60 * 1000;  //re fetch bloom config every 5 minutes;




export type BloomConfig = {
    dataKey: string; // The Redis key holding the actual bitset, e.g. "bloom:usernames:v2"
    size: number; // The size of the bitset, e.g. 10_000_000
    numHashes: number; // The number of hash functions, e.g. 7
};


let cached: {
    config: BloomConfig;
    fetchedAt: number;
} | null = null;



// m = -(n * ln(p)) / (ln(2)) ^ 2
// * k = (m / n) * ln(2)
// * Recompute whenever n(expected item count) changes meaningfully.


export function computeBloomSizing(expectedItemCount: number, falsePositiveRate: number = 0.01): { size: number, numHashes: number } {
    const m = Math.ceil(-(expectedItemCount * Math.log(falsePositiveRate)) / (Math.log(2) ** 2)); // m = -(n * ln(p)) / (ln(2)) ^ 2
    const k = Math.ceil((m / expectedItemCount) * Math.log(2)); // k = (m / n) * ln(2)

    return { size: m, numHashes: k };
};



// Called once at setup and again on every resize — points readers at the active data key.
export async function setActivateBloomConfig(config: BloomConfig): Promise<void> {
    try {
        const redisClient = getRedisClient();
        await redisClient.set(META_KEY, JSON.stringify(config,));
        cached = { config, fetchedAt: Date.now() };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : err;
        logger.error(`[cache] setActivateBloomConfig failed for key :`, { key: META_KEY, err: message });
        // fail silently — a cache write failure shouldn't break the request
    };
};



export async function getActivateBloomConfig(): Promise<BloomConfig> {
    if (cached && Date.now() - cached.fetchedAt < CONFIG_CACHE_TTL_MS) {
        return cached.config;
    };
    const redisClient = getRedisClient();
    const raw = await redisClient.get<string>(META_KEY);
    if (!raw) {
        throw new Error("[bloom] no active config found — run scripts/populateBloomFilter.ts first");
    };
    const config: BloomConfig = typeof raw === "string" ? JSON.parse(raw) : raw;
    cached = { config, fetchedAt: Date.now() };
    return config;
}