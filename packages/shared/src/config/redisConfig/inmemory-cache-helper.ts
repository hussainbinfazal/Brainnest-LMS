type Entry = {
    json: string; expiresAt: number | null
};

// Upper limit so a long dev session cannot grow memory forever
const MAX_ENTRIES = 5000;


///Keep the Map on globalThis, because nextjs  dev revaluates modules on hot reload
const g = globalThis as unknown as { __memCache?: Map<string, Entry> }



//This map is created once and we could reuse it across mulitple reloads
const store = (g.__memCache ?? new Map<string, Entry>());



///Return the live entry for a key, deleting it first if it has expired

function live(key: string): Entry | undefined {
    ///Look up the raw entry
    const entry = store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
        ///Delete the entry if it has expired
        store.delete(key);
        return undefined;
    };
    ///Return the entry if it is valid
    return entry;
};

//Get value from 
export function memGet<T>(key: string): T | null {
    ///Fetch the live entry 
    const entry = live(key);
    ///Missing or expired
    if (!entry) return null;
    return JSON.parse(entry.json) as T
};

///Setter In Memory Helper
export function memSet<T>(key: string, value: T, ttlSec: number): void {
    //Serialize like Upstash does; undefined becomes 'null' because JSON.stringify() return undefined for it
    const json = JSON.stringify(value) ?? 'null';
    ///Delete first so teh key moves to the end of the Map's insertion order
    store.delete(key);
    if (store.size >= MAX_ENTRIES) {
        //The first key in a MAP is the oldest one
        const oldest = store.keys().next().value;
        ///Guard for an empty Map
        if (oldest !== undefined) store.delete(oldest);
    };
    store.set(key, { json, expiresAt: ttlSec > 0 ? Date.now() + ttlSec * 1000 : null });
};


///Set NX: write only if the key does not exist: returns true when it wrote
export function memSetNX(key: string, value: unknown, ttlSec: number): boolean {
    ///A live key means 'already exists', so do nothing
    if (live(key)) return false;

    //Key is free, so write it
    memSet(key, value, ttlSec);

    //Tell the caller the lock or write succedded
    return true
};

///INCRBY, setting a TTL only if the key has none ( same as your EXPIRE)


export function memIncr(key: string, by: number, ttlSec: number): number {
    ///Look up the current counter, if any
    const entry = live(key);
    //A missing key starts from 0, like Redis
    const next = (entry ? Number(JSON.parse(entry.json)) : 0) + by;
    const expiresAt = entry?.expiresAt ?? Date.now() + ttlSec * 1000;
    ///Save the new count
    store.set(key, { json: String(next), expiresAt })
    ///Return the new count
    return next;

};

///DECRBY only if the key exists (same as LUA SCRIPT): return null when missing 
export function memDecrIfExists(key: string, by: number): number | null {
    ///A missing must not be created with a negative value
    const entry = live(key);
    ///Missing or expired 
    if (!entry) return null;
    //Subtract and keep the original expiry 
    const next = Number(JSON.parse(entry.json)) - by;
    ///Save the new count
    store.set(key, { json: String(next), expiresAt: entry.expiresAt });
    ///Return the new count
    return next;
}



////Delete one key
export function memDelete(key: string): void {
    ///Remove it if present
    store.delete(key)
}



////Delete every key that starts with a prefix, like redis SCAN + DEL namespace wipe
export function memDeleteByPrefix(prefix: string): void {
    //Deleting from a Map 
    for (const key of store.keys()) {
        ///Remove matching keys only 
        if (key.startsWith(prefix)) store.delete(key)
    }
}

