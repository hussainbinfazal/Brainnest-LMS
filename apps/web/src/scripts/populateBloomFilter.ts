import { computeBloomSizing, setActivateBloomConfig } from "@/lib/bloomFilter/bloomConfig";
import { connectDB, User } from "@repo/shared";
import { runPipeline } from "@repo/shared/config/redisConfig/cache-helper";
import { x86 } from "murmurhash3js";

async function main() {
  const targetFpRate = Number(process.argv[2] ?? 0.01);
 
  await connectDB(process.env.MONGODB_URI!);
  const currentCount = await User.countDocuments();
  // Floor of 1000 so a near-empty dev DB doesn't produce a degenerate tiny array
  const sizingBasis = Math.max(currentCount, 1000);
 
  const { size, numHashes } = computeBloomSizing(sizingBasis, targetFpRate);
  const dataKey = `bloom:usernames:v${Date.now()}`;
 
  console.log(
    `n=${currentCount} users -> size=${size} bits, k=${numHashes} hashes, key=${dataKey}`
  );
 
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
          p.setbit(dataKey, pos, 1);
        }
      });
    }, { count: batch.length });
    total += batch.length;
    batch = [];
  };
 
  for await (const doc of cursor) {
    if (!doc.username) continue;
    batch.push(doc.username);
    if (batch.length >= 500) await flush();
  }
  await flush();
 
  await setActivateBloomConfig({ dataKey, size, numHashes });
 
  console.log(`Bloom filter populated with ${total} usernames and set as active`);
  process.exit(0);
}
 
main().catch((err: unknown) => {
  console.error("Bloom filter backfill failed:", err);
  process.exit(1);
});