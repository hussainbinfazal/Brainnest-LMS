import { MAX_ENTRIES } from "../inmemory-cache-helper";

///Slots per key: key -> (member id -> time it was acquired, in ms)
const slotsG = globalThis as unknown as { __memSlots?: Map<string, Map<string, number>> };

///Create the map, so we can reuse it across Next.js hot reloads
const slots = (slotsG.__memSlots ??= new Map<string, Map<string, number>>());


///In memory version of your ZREMARANGEBYSCORE + ZADD + ZCARD logic


export function memAcquireSlot(key: string, id: string, max: number, ttlSec: number): boolean {
    ///Read the clock once so every check in this call agrees
    const now = Date.now();
    //Find the members for this key
    let members = slots.get(key);
    //First use of this key: create its member map
    if (!members) {
        // At the cap: first drop keys that hold nothing anymore
        if (slots.size >= MAX_ENTRIES) sweepSlots(now, ttlSec);
        // Still at the cap: evict the oldest inserted key as a last resort
        if (slots.size >= MAX_ENTRIES) {
            // The first key in a Map is the oldest inserted one
            const oldest = slots.keys().next().value;
            // Guard for an empty Map
            if (oldest !== undefined) slots.delete(oldest);
        }
        ///Empty map
        members = new Map<string, number>();
        slots.set(key, members);
    };

    ///Remove expires members, like ZREMARANGEBYSCORE key 0 (now-ttl)
    for (const [member, acquiredAt] of members) {
        ///A member older than the TTL no longer holds a slot
        if (acquiredAt <= now - ttlSec * 1000) members.delete(member);
    }
    ///A new member older than the TTL no longer holds a slot
    if (!members.has(id) && members.size >= max) {
        ///Do not leave an empty set behind for this key
        if (members.size === 0) slots.delete(key);
        ///No slots available
        return false;
    }
    ///Add the new member, like ZADD key now id
    members.set(id, now);
    ///Slot acquired
    return true;
}

///In memory version of ZREM; returns how many members were removed (0 or 1)
export function memReleaseSlot(key: string, id: string): number {
    const members = slots.get(key);
    if (!members) return 0;
    const removed = members.delete(id) ? 1 : 0;
    if (members.size === 0) slots.delete(key);
    return removed;

}

export function sweepSlots(now: number, ttlSec: number): void {
    //Check every key in the outer map
    for (const [k, m] of slots) {
        ///Newest member time for this key, or 0 when the set is empty
        const newest = m.size ? Math.max(...m.values()) : 0;
        ////if even the newest member is older/expired (or none exist), the key holds nothing
        if (newest <= now - ttlSec * 1000) slots.delete(k);
    }
}