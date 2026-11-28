import mongoose, { Types } from "mongoose";

export type Serialized<T> =
  // ObjectId becomes string (check this FIRST, because ObjectId also extends object)
  T extends Types.ObjectId ? string
  // Date becomes ISO string after JSON round-trip
  : T extends Date ? string
  // Arrays: serialize each element type
  : T extends Array<infer U> ? Serialized<U>[]
  // Plain objects: serialize every property
  : T extends object ? { [K in keyof T]: Serialized<T[K]> }
  // Primitives pass through unchanged
  : T;

// Your serializeDocument walks the object tree and converts those into plain strings
export function serializeDocument<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  // Mongo ObjectId
  if (value instanceof mongoose.Types.ObjectId) {
    return value.toString() as T;
  }

  // Date
  if (value instanceof Date) {
    return value.toISOString() as T;
  }

  // Array
  if (Array.isArray(value)) {
    return value.map(serializeDocument) as T;
  }

  // Object
  if (typeof value === "object") {
    const result: any = {};
    for (const key in value as any) {
      result[key] = serializeDocument((value as any)[key]);
    }
    return result;
  }

  return value;
}
