import { Worker } from "bullmq";
import { generateProgress } from "@/services/progressService";
import { logger } from "@/utils/logger/logger";

new Worker("progressQueue", async (job) => {
    const { userId, courseId, progress, lessonId } = job.data;
    await generateProgress({ userId: userId, courseId: courseId, progress: progress, lessonId: lessonId });
    logger.info(`Progress generated for user ${userId} and course ${courseId}`);
}, {
    connection: {
        url: process.env.UPSTASH_REDIS_URL,
    }
}
)