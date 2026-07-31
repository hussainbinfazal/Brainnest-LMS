import { getRedisClient } from "./cache";
import { logger } from "../../logger/logger";

export const CACHE_TTL = {
  SHORT: 60, //1 min - volatile data (session type data)
  MEDIUM: 60 * 15, // 15 min -  semi-stable (course listing like this )
  LONG: 60 * 60, // 1 hour
  VERY_LONG: 60 * 60 * 24 //24 hour - rarely changes(static config)
} as const


function buildKey(namespace: string, id: string | number): string {
  return `${namespace}:${id}`
}

export async function getCached<T>(
  namespace: string,
  id: string | number
): Promise<T | null> {
  const redisClient = getRedisClient()
  const key: string = buildKey(namespace, id)
  try {
    const response = await redisClient.ping();
    const value = await redisClient.get<T>(key)

    logger.info(`[cache] getCached for key:`, { key: key, namespace: namespace })
    return value ?? null
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : err
    logger.error(`[cache] getCached failed for key:`, { key: key, err: message, namespace: namespace })
    return null // fail open — don't let cache errors break the app
  }
}

export async function setCached<T>(
  namespace: string,
  id: string | number,
  value: T,
  ttlSeconds: number = CACHE_TTL.MEDIUM
): Promise<void> {
  const key = buildKey(namespace, id)
  try {
    const redisClient = getRedisClient()
    const response = await redisClient.ping();
    logger.info("Redis ping successful", { response });
    await redisClient.set(key, value, { ex: ttlSeconds })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : err
    logger.error(`[cache] setCached failed for key :`, { key, err: message, namespace: namespace })
    // fail silently — a cache write failure shouldn't break the request
  }
}

export async function invalidateCached(
  namespace: string,
  id?: string | number
): Promise<void> {
  const redisClient = getRedisClient()
  try {
    if (id !== undefined) {
      await redisClient.del(buildKey(namespace, id))
      return
    }

    // no id → wipe everything under this namespace
    let cursor = 0
    do {
      const result = await redisClient.scan(cursor, {
        match: `${namespace}:*`,
        count: 100,
      })
      cursor = Number(result[0])
      const keys = result[1]
      if (keys.length > 0) {
        await redisClient.del(...keys)
      }
    } while (cursor !== 0)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : err
    logger.error(`[cache] invalidateCached failed for namespace:`, { err: message, namespace: namespace })
  }
}


