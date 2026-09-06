export async function register() {
    console.log("🔴 INSTRUMENTATION RUNNING, runtime:", process.env.NEXT_RUNTIME);
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { Redis } = await import("@upstash/redis");
        const { initializeRedis } = await import("../../packages/shared/src/config/redisConfig/cache");
        initializeRedis(new Redis({ url: process.env.UPSTASH_REDIS_URL!, token: process.env.UPSTASH_REDIS_TOKEN! }));
        console.log("🔴 REDIS INITIALIZED");
    }
}