import { getRedisClient, User } from "@repo/shared";
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


export function estimateCurrentFalsePositiveRate(
    currentItemCount: number,
    config: { size: number; numHashes: number }
): number {
    const { size: m, numHashes: k } = config;
    return Math.pow(1 - Math.exp((-k * currentItemCount) / m), k);
}


export async function getActiveBloomConfig(): Promise<BloomConfig> {
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

const currentUserCount = await User.countDocuments();
const config = await getActiveBloomConfig();
const currentFpRate = estimateCurrentFalsePositiveRate(currentUserCount, config);
if (currentFpRate > 0.03) { // 3x your original 1% target
    logger.warn(`FP rate degraded to ${(currentFpRate * 100).toFixed(1)}% — resize needed`);
    // trigger resizeBloomFilter.ts
    //Trigger resize when the app is production and the current false positive rate is greater than 3x the target, dont over complicate everything now,
}
