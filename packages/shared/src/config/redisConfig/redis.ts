//This is old config, now i am using updated config on the basis of the serverless and the serverfull


// import { Redis as UpstashRedis } from '@upstash/redis'
// import IORedis from "ioredis";



// if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
//     throw new Error("Missing Upstash Redis environment variables")
// }
// /*
// ----------------------------------
// Upstash SDK Client Serverless
// Used for caching / KV operations
// ----------------------------------
// */
// const redisClient = new UpstashRedis({
//     url: process.env.UPSTASH_REDIS_URL!,
//     token: process.env.UPSTASH_REDIS_TOKEN!,
// })


// /*
// ----------------------------------
// ioredis Client Serverfull
// Used for BullMQ queues
// ----------------------------------
// */


// export const connection = new IORedis(
//     process.env.REDIS_URL!,{
//         maxRetriesPerRequest:null

//     }
// );