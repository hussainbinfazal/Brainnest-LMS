import { Redis as UpstashRedis } from '@upstash/redis'
import IORedis from "ioredis";



if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
    throw new Error("Missing Upstash Redis environment variables")
}
/*
----------------------------------
Upstash SDK Client
Used for caching / KV operations
----------------------------------
*/
const redisClient = new UpstashRedis({
    url: process.env.UPSTASH_REDIS_URL!,
    token: process.env.UPSTASH_REDIS_TOKEN!,
})


/*
----------------------------------
ioredis Client
Used for BullMQ queues
----------------------------------
*/
const ioRedis = new IORedis(process.env.UPSTASH_REDIS_URL!, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});
export { redisClient, ioRedis }

