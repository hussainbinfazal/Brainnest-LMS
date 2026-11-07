import { getIORedisClient } from "./queue";
import { logger } from "../../logger/logger";
import { FALLBACK_TTL_SEC, memDecrIfExists, memDelete, memDeleteByPrefix, memGet, memIncr, memSet, memSetNX } from "./inmemory-cache-helper";
import { buildKey, CACHE_TTL, CacheOp, execOps, USE_MEMORY } from "./cache-helper";
import { markRedisDownFailure, redisIsDown } from "./cache";
import { GENERATE_DESCRIPTION_STATUS } from "./redisCackeKeys";




const memTtlIO = (ttl: number): number => (USE_MEMORY) ? ttl : Math.min(ttl, FALLBACK_TTL_SEC);
// Write strings raw and everything else as JSON, exactly like Upstash does
function toIORedis(value: unknown): string {
    // Keep strings as they are
    if (typeof value === "string") return value;
    // JSON.stringify(undefined) returns undefined, so fall back to "null"
    return JSON.stringify(value) ?? "null";
}
// Read like Upstash: try JSON first, fall back to the raw string
function fromIORedis<T>(raw: string): T {
    // Try to parse JSON
    try {
        // Return the parsed value
        return JSON.parse(raw) as T;
    } catch {
        // Not JSON, so it was a raw string
        return raw as unknown as T;
    }
}
export async function getCachedIO<T>(
    namespace: string,
    id: string | number
): Promise<T | null> {
    const key: string = buildKey(namespace, id)
    if (USE_MEMORY || redisIsDown()) return memGet<T>(key);
    try {

        const redisClient = getIORedisClient()
        // const response = await redisClient.ping();
        const value = await redisClient.get(key)

        logger.info(`[cache] getCached for key:`, { key: key, namespace: namespace })
        return value === null ? null : fromIORedis<T>(value)
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : err
        logger.error(`[cache] getCached failed for key:`, { key: key, err: message, namespace: namespace })
        markRedisDownFailure(err)
        return null // fail open — don't let cache errors break the app
    }
}

export async function getCachedHashIO(
    namespace: string,
    id: string | number
): Promise<Record<string, string> | null> {
    const key = buildKey(namespace, id);
    // if (USE_MEMORY || redisIsDown()) return memGet<Record<string, string>>(key);
    try {
        const value = await getIORedisClient().hgetall(key);
        return Object.keys(value).length > 0 ? value : null;
    } catch (err: unknown) {
        console.log("This is the error on the cache")
        const message = err instanceof Error ? err.message : err;
        logger.error("[cache] getCachedHash failed for key:", { key, err: message, namespace });
        markRedisDownFailure(err);
        return null;
    }
}

export async function setCachedIO<T>(
    namespace: string,
    id: string | number,
    value: T,
    ttlSeconds: number = CACHE_TTL.MEDIUM,
): Promise<void> {
    const key = buildKey(namespace, id)
    if (USE_MEMORY || redisIsDown()) return memSet(key, value, memTtlIO(ttlSeconds));
    try {
        const redisClient = getIORedisClient()
        const response = await redisClient.ping();
        logger.info("Redis IO ping successful", { response });
        await redisClient.set(key, toIORedis(value), "EX", ttlSeconds);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : err
        logger.error(`[cache] setCached failed for key :`, { key, err: message, namespace: namespace })
        markRedisDownFailure(err)
        // fail silently — a cache write failure shouldn't break the request
    }
}

export async function invalidateCachedIO(
    namespace: string,
    id?: string | number
): Promise<void> {
    if (id !== undefined) memDelete(buildKey(namespace, id));
    // No id: wipe every key that starts with "namespace:"
    else memDeleteByPrefix(`${namespace}:`);
    // Development or breaker open: nothing more to do (see the note below about lost deletes)
    if (USE_MEMORY || redisIsDown()) return;
    try {
        const redisClient = getIORedisClient()
        if (id !== undefined) {
            await redisClient.del(buildKey(namespace, id))
            return
        }

        // no id → wipe everything under this namespace
        let cursor = 0
        do {
            const [next, keys] = await redisClient.scan(cursor, "MATCH", `${namespace}:*`, "COUNT", 100);
            cursor = Number(next);
            if (keys.length > 0) {
                await redisClient.del(...keys);
            }
        } while (cursor !== 0)
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : err
        logger.error(`[cache] invalidateIOCached failed for namespace:`, { err: message, namespace: namespace })
        markRedisDownFailure(err)

    }
}



//
export async function setOnlyIfNotExistIO(namespace: string, id: string | number, value: string, ttlSeconds: number = CACHE_TTL.SHORT): Promise<boolean> {
    const key = buildKey(namespace, id)
    if (USE_MEMORY || redisIsDown()) return memSetNX(key, value, memTtlIO(ttlSeconds));
    try {
        const result = await getIORedisClient().set(key, toIORedis(value), "EX", ttlSeconds, "NX") //nx means only set if key doesn't exist
        return result === "OK" //null when key already exists
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : err
        logger.error(`[cache] setOnlyIfNotExist failed for key :`, { key, err: message, namespace: namespace })
        markRedisDownFailure(err)
        return memSetNX(key, value, memTtlIO(ttlSeconds));

    }
}

export async function incrementWithTtlIO(
    namespace: string,
    id: string | number,
    ttlSeconds: number,
    by = 1,
): Promise<number> {
    const key = buildKey(namespace, id)
    try {
        if (USE_MEMORY || redisIsDown()) return memIncr(key, by, memTtlIO(ttlSeconds));
        const res = await getIORedisClient().multi().incrby(key, by).expire(key, ttlSeconds, "NX").exec();
        if (!res) throw new Error("Multi aborted");
        // Each entry is [error, result], so unpack the INCRBY entry
        const [incrErr, count] = res[0];
        // Per-command errors do not throw by themselves, so rethrow
        if (incrErr) throw incrErr;
        // Unpack the EXPIRE entry
        const [expireErr] = res[1];
        // A failed EXPIRE would leave a counter that never expires, so rethrow
        if (expireErr) throw expireErr;

        return Number(count);
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

export async function decrementIfExistsIO(
    namespace: string,
    id: string | number,
    by = 1,
): Promise<number | null> {
    const key = buildKey(namespace, id);
    if (USE_MEMORY || redisIsDown()) return memDecrIfExists(key, by);
    try {
        return (await getIORedisClient().eval(DECR_IF_EXISTS, key, String(by))) as number | null;
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
export async function getCachedManyIO<T>(entries: { namespace: string, id: string | number }[], namespace: string[], ids: (string | number)[]): Promise<Map<string | number, T | null>> {
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
    entries.forEach((entry, i) => {
        out.set(buildKey(entry.namespace, entry.id), (results[i] as T | null | undefined) ?? null);
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
export async function setCachedManyIO<T>(

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
export async function runPipelineIO<T = unknown>(
    build: (pipeline: ReturnType<ReturnType<typeof getIORedisClient>["pipeline"]>) => void,
    context: Record<string, unknown>
): Promise<T[] | null> {
    if (USE_MEMORY || redisIsDown()) return null;
    try {

        const redisClient: ReturnType<typeof getIORedisClient> = getIORedisClient();
        const pipeLine: ReturnType<ReturnType<typeof getIORedisClient>["pipeline"]> = redisClient.pipeline();
        build(pipeLine);
        const response = await pipeLine.exec();
        return response as T[];
    }
    catch (error: unknown) {
        const message = error instanceof Error ? error.message : error;
        logger.error(`[cache] runPipeline failed for context :`, { context, err: message });
        markRedisDownFailure(error);
        return null
    }
}

// Development keeps the full TTL; an outage caps it so stale data stays short-lived


function memApplyOpsToMemoryIO<T>(ops: CacheOp<T>[]): unknown[] {
    ///Operations are applied in order
    return ops.map((op) => {
        const key = buildKey(op.namespace, op.id)
        //Set
        if (op.type === 'set') {
            memSet(key, op.value, memTtlIO(op.ttlSeconds))
            return "OK"
        }
        //Del
        if (op.type === 'del') {
            memDelete(key);
            return 1;
        }
        // Get: return the stored value, or null on a miss
        return memGet(key);
    })
};

export async function execIoOps<T>(ops: CacheOp<T>[]): Promise<unknown[]> {
    //Developer or breaker open never touch redis
    if (USE_MEMORY || redisIsDown()) return memApplyOpsToMemoryIO(ops);

    ///Production
    const results = await runPipelineIO<unknown>((p) => {
        ///Translate each op into per op
        for (const op of ops) {
            const key = buildKey(op.namespace, op.id);
            if (op.type === "set") {
                p.set(key, toIORedis(op.value), "EX", op.ttlSeconds);
            } else if (op.type === "get") {
                p.get(key);
            } else {
                p.del(key);
            }
        }
    }, { count: ops.length, sets: ops.filter((op) => op.type === "set").length, gets: ops.filter((op) => op.type === "get").length, deletes: ops.filter((op) => op.type === "del").length })
    if (results === null) return memApplyOpsToMemoryIO(ops);
    return results.map((r, i) => (ops[i].type === "get" && typeof r === "string" ? fromIORedis(r) : r));
}

export function draftStatusKeyIO(userId: string, uploadId: string) { return `${GENERATE_DESCRIPTION_STATUS.namespace}:${uploadId}:${userId}` } // key for draft statusKey


export async function setUpsertCachedIO<T extends object>(namespace: string, id: string | number, value: T, ttlSeconds: number = CACHE_TTL.MEDIUM): Promise<void> {
    // if (USE_MEMORY || redisIsDown()) return memSet(buildKey(namespace, id), value, memTtlIO(ttlSeconds));
    const key = buildKey(namespace, id);
    logger.info("set Upsert function is called with this key ", { key });
    const clean = Object.fromEntries(Object.entries(value).filter(([, value]) => value !== undefined)) as Record<string, string>;
    const redisClient = getIORedisClient();
   const results = await redisClient.multi().hset(key, clean).expire(key, ttlSeconds, "NX").exec();
   const commandError = results?.find(([error]) => error !== null)?.[0];
   if (commandError) throw commandError;

}
///Hash set helper to partial update same document,
// A Hash lets you update single fields (HSET) without touching the TTL. EXPIRE ... NX sets the TTL only if none exists, so the first call fixes the expiry and later calls never move it.



///CacheOps with redis Pipeline

//  Run a mixed batch of sets and deletes, across any number of namespaces, in a single pipeline round trip.
//  Ops execute in array order — if a set and a del target the same key,
//  whichever you list LAST wins.List del before set to invalidate - then -
//  write; list set before del if you actually want the delete to be final.







// await runCacheOps([
//   { type: "del", namespace: "courses", id: 42 },
//   { type: "set", namespace: "courses", id: 42, value: freshCourseData, ttlSeconds: CACHE_TTL.LONG },
//   { type: "del", namespace: "userCourses", id: userId }, // different namespace, same batch
// ]);




///Read through Redis, or through memory while Redis is marked down
