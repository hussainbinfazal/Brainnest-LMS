import { logger, initializeRedis } from '@repo/shared'
import { Redis as UpstashRedis } from '@upstash/redis'




if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
    throw new Error("Missing Upstash Redis environment variables")
}
/*
----------------------------------
Upstash SDK Client
Used for caching / KV operations
----------------------------------
*/
export const redisClient = new UpstashRedis({
    url: process.env.UPSTASH_REDIS_URL!,
    token: process.env.UPSTASH_REDIS_TOKEN!,
})
initializeRedis(redisClient);
logger.info("This is the redis Client on the ")
export default redisClient

/*
----------------------------------
ioredis Client
Used for BullMQ queues
----------------------------------
*/
// const ioRedis = new IORedis(process.env.UPSTASH_REDIS_URL!, {
//     maxRetriesPerRequest: null,
//     enableReadyCheck: false
// });
// export { redisClient, ioRedis }

