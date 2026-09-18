// One-time backfill: run this once to seed the Bloom filter from every
// existing username already in Mongo. After this, new signups keep the
// filter in sync incrementally via bloomAdd() (see check-username route
// comment for where to wire that call in).
//
// Run with: npx tsx scripts/populateBloomFilter.ts

import { connectDB, logger } from '@repo/shared';
import { User } from '@repo/shared';
import { bloomAdd } from '@/lib/bloomFilter/bloomFilter';



async function main() {
    try {
        await connectDB(process.env.MONGODB_URI!);
        const cursor = await User.find({}, {
            username: 1,
        }).lean().cursor();
        let count = 0
        for await (const doc of cursor) {
            await bloomAdd(doc.name);
            count++;
        }
        console.log(`Added ${count} users to Bloom filter`);
        process.exit(0);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);

        logger.error(`Error populating Bloom filter:`, { error: message });
        process.exit(1);
    }
}

