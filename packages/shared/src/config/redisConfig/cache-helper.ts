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
    // const response = await redisClient.ping();
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
//Get Cache in Batch 
// Fetch multiple keys under one namespace in a single round trip.
export async function getCachedMany<T>(entries: { namespace: string, id: string | number }[], namespace: string[], ids: (string | number)[]): Promise<Map<string | number, T | null>> {
  const out = new Map<string | number, T | null>();
  if (ids.length === 0) return out;

  const keys = entries.map(({ namespace, id }) => buildKey(namespace, id));
  const results = await runPipeline<T | null>(
    (p) => keys.forEach((key) => p.get(key)),
    { count: entries.length, namespaces: [...new Set(entries.map((e) => e.namespace))] }
  );

  ids.forEach((id: string | number, i: number) => {
    out.set(id, results?.[i] ?? null);
  });
  logger.info("[cache] getCachedMany", { count: entries.length });
  return out

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
  await runPipeline(
    //Build pipeline of set commands
    (p) => entries.forEach(({ namespace, id, value, ttlSeconds = CACHE_TTL.MEDIUM }) => p.set(buildKey(namespace, id), value, { ex: ttlSeconds })),

    //Pass context
    { count: entries.length, namespaces: [...new Set(entries.map((e) => e.namespace))] }

  );
  logger.info("[cache] setCachedMany", { count: entries.length });
};




///Set cache with redis pipeline
export async function runPipeline<T = unknown>(
  build: (pipeline: ReturnType<ReturnType<typeof getRedisClient>["pipeline"]>) => void,
  context: Record<string, unknown>
): Promise<T[] | null> {
  const redisClient: ReturnType<typeof getRedisClient> = getRedisClient();
  const pipeLine: ReturnType<ReturnType<typeof getRedisClient>["pipeline"]> = redisClient.pipeline();
  build(pipeLine);

  try {
    const response = await pipeLine.exec();
    return response as T[];
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[cache] Pipeline exec failed:`, { error: message, context: context });
    return null;
  }
}


///CacheOps with redis Pipeline

//  Run a mixed batch of sets and deletes, across any number of namespaces, in a single pipeline round trip.
//  Ops execute in array order — if a set and a del target the same key,
//  whichever you list LAST wins.List del before set to invalidate - then -
//  write; list set before del if you actually want the delete to be final.

type CacheOp<T> = {
  type: "set", namespace: string, id: string | number, value: T, ttlSeconds: number
} | {
  type: "get", namespace: string, id: string | number
} | {
  type: 'del', namespace: string, id: string | number
}


export async function runCacheOps<T>(ops: CacheOp<T>[]): Promise<void> {
  if (ops.length === 0) return //if no ops, do nothing

  await runPipeline((p: ReturnType<ReturnType<typeof getRedisClient>["pipeline"]>) => {
    ops.forEach((op: CacheOp<T>) => {
      const key: string = buildKey(op.namespace, op.id)
      if (op.type === "set") {
        p.set(key, op.value, { ex: op.ttlSeconds })
      } else if (op.type === "get") {
        p.get(key)
      } else if (op.type === "del") {
        p.del(key)
      }
    })
  }, { count: ops.length, sets: ops.filter((op) => op.type === "set").length, gets: ops.filter((op) => op.type === "get").length, deletes: ops.filter((op) => op.type === "del").length });

  logger.info("[cache] runCacheOps", { count: ops.length });
}


// await runCacheOps([
//   { type: "del", namespace: "courses", id: 42 },
//   { type: "set", namespace: "courses", id: 42, value: freshCourseData, ttlSeconds: CACHE_TTL.LONG },
//   { type: "del", namespace: "userCourses", id: userId }, // different namespace, same batch
// ]);
