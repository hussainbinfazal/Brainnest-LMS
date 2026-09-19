// Run this when getBloomStats().fallbackRate has crept up noticeably from
// where it started (e.g. 1% -> 15%+) — it means actual user count has
// outgrown the array size the filter was originally tuned for.
//
// Usage: npx tsx scripts/resizeBloomFilter.ts [targetFalsePositiveRate]
// (defaults to 0.01 if omitted)

import { computeBloomSizing, setActivateBloomConfig } from "@/lib/bloomFilter/bloomConfig";
import { resetBloomStats } from "@/lib/bloomFilter/bloomStats";
import { connectDB, User } from "@repo/shared";
import { runPipeline } from "@repo/shared/config/redisConfig/cache-helper";
import { x86 } from "murmurhash3js";

 

 
async function main() {
  const targetFpRate = Number(process.argv[2] ?? 0.01);
 
  await connectDB(process.env.MONGODB_URI!);
  const currentCount = await User.countDocuments();
 
  const { size, numHashes } = computeBloomSizing(currentCount, targetFpRate);
  const newDataKey = `bloom:usernames:v${Date.now()}`;
 
  console.log(
    `Resizing for n=${currentCount} users, p=${targetFpRate} -> size=${size} bits, k=${numHashes} hashes`
  );
  console.log(`Building new bitset at ${newDataKey} (old key stays live until swap)...`);
 
  // Build the new bitset fully BEFORE touching the active pointer, so
  // in-flight reads keep hitting the old (still-correct) filter the
  // entire time this runs — no readers ever see a partially-built set.
  const cursor = User.find({}, { username: 1 }).lean().cursor();
  let batch: string[] = [];
  let total = 0;
 
  const flush = async () => {
    if (batch.length === 0) return;
    await runPipeline((p) => {
      batch.forEach((username) => {
        const normalized = username.toLowerCase();
        const h1 = x86.hash32(normalized, 1);
        const h2 = x86.hash32(normalized, 2);
        for (let i = 0; i < numHashes; i++) {
          const pos = ((h1 + i * h2) >>> 0) % size;
          p.setbit(newDataKey, pos, 1);
        }
      });
    }, { count: batch.length });
    total += batch.length;
    batch = [];
  };
 
  for await (const doc of cursor) {
    if (!doc.username) continue;
    batch.push(doc.username);
    if (batch.length >= 500) await flush(); // batch pipeline calls, don't queue the entire user table in one shot
  }
  await flush();
 
  console.log(`Wrote ${total} usernames into ${newDataKey}`);
 
  // Atomic swap: readers pick up the new key/size/hashes on their next
  // config fetch (within CONFIG_CACHE_TTL_MS). No coordinated deploy needed.
  await setActivateBloomConfig({ dataKey: newDataKey, size, numHashes });
  await resetBloomStats();
 
  console.log("Active config swapped. Old bitset left in place for rollback — delete manually once confirmed stable.");
  process.exit(0);
}
 
main().catch((err) => {
  console.error("Bloom filter resize failed:", err);
  process.exit(1);
});