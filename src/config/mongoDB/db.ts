import { logger } from "@/utils/logger/logger";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in environment variables");
}

let cached = global.mongooseCache;
if (!cached) {
  cached = global.mongooseCache = { // setting node global mongoose object to null
    conn: null,
    promise: null,

  }
}
export const connectDB = async () => {
  try {
    if (cached!.conn) {
      return cached!.conn
    }
    if (!cached!.promise) {
      cached!.promise = mongoose.connect(MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
      });
    }
    cached!.conn = await cached!.promise

    logger.info({host:cached.conn.connection.host},"MongoDB Connected");
    return cached!.conn;
  } catch (error: any) {
    logger.error(error,"Database connection failed")
    throw error
  }
};