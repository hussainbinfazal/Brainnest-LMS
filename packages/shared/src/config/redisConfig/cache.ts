import {Redis as UpstashRedis} from "@upstash/redis";
import { logger } from "../../logger/logger";

if(!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN){
    logger.error("Missing upstash Redis environment variables")
    throw new Error("Missing upstash Redis environment variables")
}


export const redisClient = new UpstashRedis({
    url:process.env.UPSTASH_REDIS_URL,
    token:process.env.UPSTASH_REDIS_TOKEN
})