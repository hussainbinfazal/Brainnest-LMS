import { x86 } from "murmurhash3js";
import {
    setCached,
    getCached,
    CACHE_TTL,
    runPipeline,
} from "@repo/shared/config/redisConfig/cache-helper";
import { getActivateBloomConfig } from "./bloomConfig";
// const BLOOM_KEY = "bloom:username";

//Estimated Hash Function
//  m = bit array size, k = number of hash functions.
// Tuned for n ~= 1,000,000 existing usernames at ~1% false positive rate.
// m = -(n * ln(p)) / (ln(2))^2  ~=  9.6 bits per entry;
// k = (m/n) * ln(2) ~=  7;

const SIZE: number = 10_000_000; //bits (-1.25MB in Redis)
const NUM_HASHES: number = 7;

function getHashPositions(username: string): number[] {
    const normalized = username.toLowerCase();
    //Two independant hash function
    const h1 = x86.hash32(normalized, 1); //number, seed
    const h2 = x86.hash32(normalized, 2);
    //Kirsh-Mitzenmacher: g_i(x) = h_i(x)  + i * h2(x) mod m

    return Array.from({ length: NUM_HASHES }, (_, i) => {
        const combined = (h1 + i * h2) >>> 0; // Unsigned right shift(32 Bit);
        return combined % SIZE; ////Modulo operation for number between 0 and size for hash Index
    });
}

//Function Call post user registration, to keep the filter in sync.

export async function bloomAdd(username: string): Promise<void> {
    const config = await getActivateBloomConfig();
    const positions = getHashPositions(username); //Get hash positions
    await runPipeline(
        (p) => positions.forEach((pos) => p.setbit(config.dataKey, pos, 1)),
        { username: username }
    );
}


export async function bloomMightContain(username: string) {
    const config = await getActivateBloomConfig();
    const positions: number[] = getHashPositions(username);
    const results: number[] | null = await runPipeline<number>((p) => positions.forEach((pos) => p.getbit(config.dataKey, pos)), { username: username });

    return results?.every((bit) => bit === 1) ?? false; ///fail open → treat as "might be taken" so caller confirms via Mong
};

