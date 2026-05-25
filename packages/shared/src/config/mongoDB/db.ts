import { logger } from "@repo/shared";
import mongoose from "mongoose";


declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}



let cached = global.mongooseCache;
if (!cached) {
  cached = global.mongooseCache = { // setting node global mongoose object to null
    conn: null,
    promise: null,

  }
}
export const connectDB = async (mongoDbUrl?: string) => {
  if (!mongoDbUrl) {
  throw new Error("Please define the MONGODB_URI environment variable in environment variables");
}
  try {
    if (cached!.conn &&
      mongoose.connection.readyState === 1) {
      return cached!.conn
    }
    if (!cached!.promise) {
      cached!.promise = mongoose.connect(mongoDbUrl, {
        bufferCommands: false,
        maxPoolSize: 10,
      });
    }
    cached!.conn = await cached!.promise

    logger.info( "MongoDB Connected",{ host: cached.conn.connection.host });
    return cached!.conn;
  } catch (error: unknown) {
    cached!.promise = null
    logger.error("Database connection failed",{error})
    throw error
  }
};