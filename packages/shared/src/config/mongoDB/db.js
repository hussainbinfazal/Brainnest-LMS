import { logger } from "@repo/shared";
import mongoose from "mongoose";
mongoose.set("strictQuery", true);
mongoose.connection.on("error", (err) => {
    logger.error("MongoDB error", { error: err });
});
mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
});
mongoose.connection.on("connected", () => {
    logger.info("MongoDB connected");
});
let cached = global.mongooseCache;
if (!cached) {
    cached = global.mongooseCache = {
        conn: null,
        promise: null,
    };
}
export const connectDB = async (mongoDbUrl) => {
    if (!mongoDbUrl) {
        throw new Error("Please define the MONGODB_URI environment variable in environment variables");
    }
    try {
        if (cached.conn &&
            mongoose.connection.readyState === 1) {
            return cached.conn;
        }
        if (!cached.promise) {
            cached.promise = mongoose.connect(mongoDbUrl, {
                bufferCommands: false,
                maxPoolSize: Number(process.env.DB_MAX_POOL_SIZE) || 10,
                autoIndex: process.env.NODE_ENV !== "production",
            });
        }
        cached.conn = await cached.promise;
        logger.info("MongoDB Connected", { host: cached.conn.connection.host });
        return cached.conn;
    }
    catch (error) {
        cached.promise = null;
        logger.error("Database connection failed", { error });
        throw error;
    }
};
process.on("SIGINT", async () => {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed due to app termination");
    process.exit(0);
});
