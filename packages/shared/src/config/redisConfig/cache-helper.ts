import { getRedisClient, markRedisDownFailure, redisIsDown } from "./cache";
import { logger } from "../../logger/logger";
import { execOps, memDecrIfExists, memDelete, memDeleteByPrefix, memGet, memIncr, memSet, memSetNX } from "./inmemory-cache-helper";

export const CACHE_TTL = {
  SHORT: 60, //1 min - volatile data (session type data)
  MEDIUM: 60 * 15, // 15 min -  semi-stable (course listing like this )
  LONG: 60 * 60, // 1 hour
  VERY_LONG: 60 * 60 * 24 //24 hour - rarely changes(static config)
} as const


export function buildKey(namespace: string, id: string | number): string {
  return `${namespace}:{${id}}` //Redis Cluster hashes only what's inside the first {}. Same content inside braces → same slot → same node → safe to use together in MULTI/EXEC or Lua. (Hash tags in Redis Cluster: force related keys onto the same node.)
};

export const USE_MEMORY = process.env.NODE_ENV !== "production";



export async function getCached<T>(
  namespace: string,
  id: string | number
): Promise<T | null> {
  const redisClient = getRedisClient()
  const key: string = buildKey(namespace, id)
  if (USE_MEMORY || redisIsDown()) return memGet<T>(key);
  try {

    // const response = await redisClient.ping();
    const value = await redisClient.get<T>(key)

    logger.info(`[cache] getCached for key:`, { key: key, namespace: namespace })
    return value ?? null
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : err
    logger.error(`[cache] getCached failed for key:`, { key: key, err: message, namespace: namespace })
    markRedisDownFailure(err)
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
  if (USE_MEMORY || redisIsDown()) return memSet(key, value, ttlSeconds);
  try {
    const redisClient = getRedisClient()
    const response = await redisClient.ping();
    logger.info("Redis ping successful", { response });
    await redisClient.set(key, value, { ex: ttlSeconds })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : err
    logger.error(`[cache] setCached failed for key :`, { key, err: message, namespace: namespace })
    markRedisDownFailure(err)
    // fail silently — a cache write failure shouldn't break the request
  }
}

export async function invalidateCached(
  namespace: string,
  id?: string | number
): Promise<void> {
  if (id !== undefined) memDelete(buildKey(namespace, id));
  // No id: wipe every key that starts with "namespace:"
  else memDeleteByPrefix(`${namespace}:`);
  // Development or breaker open: nothing more to do (see the note below about lost deletes)
  if (USE_MEMORY || redisIsDown()) return memDeleteByPrefix(namespace)
  try {
    const redisClient = getRedisClient()
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
    markRedisDownFailure(err)
    return id !== undefined ? memDelete(buildKey(namespace, id)) : memDeleteByPrefix(namespace)
  }
}



//
export async function setOnlyIfNotExist(namespace: string, id: string | number, value: string, ttlSeconds: number = CACHE_TTL.SHORT): Promise<boolean> {
  const key = buildKey(namespace, id)
  if (USE_MEMORY || redisIsDown()) return memSetNX(key, value, ttlSeconds);
  try {
    const result = await getRedisClient().set(key, value, { ex: ttlSeconds, nx: true }) //nx means only set if key doesn't exist
    return result === "OK" //null when key already exists
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : err
    logger.error(`[cache] setOnlyIfNotExist failed for key :`, { key, err: message, namespace: namespace })
    markRedisDownFailure(err)
    return memSetNX(key, value, ttlSeconds);

  }
}

export async function incrementWithTtl(
  namespace: string,
  id: string | number,
  ttlSeconds: number,
  by = 1,
): Promise<number | null> {
  const key = buildKey(namespace, id)
  try {
    if (USE_MEMORY || redisIsDown()) return memIncr(key, by, ttlSeconds);
    const tx = getRedisClient().multi();
    tx.incrby(key, by);
    tx.expire(key, ttlSeconds, 'NX'); // TTL only if the key has none
    const [count] = await tx.exec<[number, number]>();
    return count;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : err;
    logger.error(`[cache] incrementWithTtl failed for key :`, { key, err: message, namespace: namespace });
    markRedisDownFailure(err);
    return memIncr(key, by, ttlSeconds);

  }
}

// Decrement only if the key exists. A plain DECR on a missing key
// creates -1 with no TTL, which is the same trap in reverse.
const DECR_IF_EXISTS = `
if redis.call('EXISTS', KEYS[1]) == 1 then
  return redis.call('DECRBY', KEYS[1], ARGV[1])
end
return nil
`;

export async function decrementIfExists(
  namespace: string,
  id: string | number,
  by = 1,
): Promise<number | null> {
  const key = buildKey(namespace, id);
  if (USE_MEMORY || redisIsDown()) return memDecrIfExists(key, by);
  try {
    return (await getRedisClient().eval(DECR_IF_EXISTS, [key], [String(by)])) as number | null;
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : err;
    logger.error(`[cache] decrementIfExists failed for key :`, { key, err: message, namespace: namespace });
    markRedisDownFailure(err);
    return memDecrIfExists(key, by);
  }
}

//Get Cache in Batch 
// Fetch multiple keys under one namespace in a single round trip.
export async function getCachedMany<T>(entries: { namespace: string, id: string | number }[], namespace: string[], ids: (string | number)[]): Promise<Map<string | number, T | null>> {
  // const keys = entries.map(({ namespace, id }) => buildKey(namespace, id));
  const out = new Map<string | number, T | null>();
  if (entries.length === 0) return out;
  // if (USE_MEMORY || redisIsDown()) { entries.forEach((e, i) => out.set(ids[i], memGet<T>(buildKey(e.namespace, e.id)))); return out; }

  const results = await execOps<T>(entries.map((e) => ({ namespace: e.namespace, id: e.id, type: "get" })));
  // const results = await runPipeline<T | null>(
  //   (p) => keys.forEach((key) => p.get(key)),
  //   { count: entries.length, namespaces: [...new Set(entries.map((e) => e.namespace))] }
  // );

  // Pair each result with its id, using null for a miss
  entries.forEach((_, i) => {
    out.set(ids[i], (results[i] as T | null | undefined) ?? null);
  });
  logger.info("[cache] getCachedMany", { count: entries.length });
  return out;
};

//Usage example
// const results = await getCachedMany([
//   { namespace: "courses", id: 1 },
//   { namespace: "userCourses", id: userId },
// ]);

// const course = results.get(buildKey("courses", 1));
// const enrollments = results.get(buildKey("userCourses", userId));

//Set Cached Many
//Set multiple keys under one namespace in a single round trip.
export async function setCachedMany<T>(

  entries: { namespace: string, id: string | number; value: T; ttlSeconds?: number }[]
): Promise<void> {
  if (entries.length === 0) return;
  ///Turn each entry into a set operation with the default ttl
  await execOps<T>(entries.map((e) => ({ namespace: e.namespace, id: e.id, type: "set" as const, value: e.value, ttlSeconds: e.ttlSeconds ?? CACHE_TTL.MEDIUM })));
  // await runPipeline(
  //   //Build pipeline of set commands
  //   (p) => entries.forEach(({ namespace, id, value, ttlSeconds = CACHE_TTL.MEDIUM }) => p.set(buildKey(namespace, id), value, { ex: ttlSeconds })),

  //   //Pass context
  //   { count: entries.length, namespaces: [...new Set(entries.map((e) => e.namespace))] }

  // );
  logger.info("[cache] setCachedMany", { count: entries.length });
};




///Set cache with redis pipeline
export async function runPipeline<T = unknown>(
  build: (pipeline: ReturnType<ReturnType<typeof getRedisClient>["pipeline"]>) => void,
  context: Record<string, unknown>
): Promise<T[] | null> {
  if (USE_MEMORY || redisIsDown()) return null;

  const redisClient: ReturnType<typeof getRedisClient> = getRedisClient();
  const pipeLine: ReturnType<ReturnType<typeof getRedisClient>["pipeline"]> = redisClient.pipeline();
  build(pipeLine);
  const response = await pipeLine.exec();
  return response as T[];
}


///CacheOps with redis Pipeline

//  Run a mixed batch of sets and deletes, across any number of namespaces, in a single pipeline round trip.
//  Ops execute in array order — if a set and a del target the same key,
//  whichever you list LAST wins.List del before set to invalidate - then -
//  write; list set before del if you actually want the delete to be final.

export type CacheOp<T> = {
  type: "set", namespace: string, id: string | number, value: T, ttlSeconds: number
} | {
  type: "get", namespace: string, id: string | number
} | {
  type: 'del', namespace: string, id: string | number
}


export async function runCacheOps<T>(ops: CacheOp<T>[]): Promise<void> {
  if (ops.length === 0) return //if no ops, do nothing
  //Run Pipeline never throws an error, so there is no need to try/catch
  await execOps(ops);
}


// await runCacheOps([
//   { type: "del", namespace: "courses", id: 42 },
//   { type: "set", namespace: "courses", id: 42, value: freshCourseData, ttlSeconds: CACHE_TTL.LONG },
//   { type: "del", namespace: "userCourses", id: userId }, // different namespace, same batch
// ]);




///Read through Redis, or through memory while Redis is marked down
