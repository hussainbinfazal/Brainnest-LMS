import { Queue } from "bullmq";


export const certificateQueue = new Queue("certificateQueue", {
    connection: {
        url: process.env.UPSTASH_REDIS_URL,
    },
    defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        backoff: {
            type: "exponential",
            delay: 5000,
        },
    },
});


