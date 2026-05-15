import { Worker } from "bullmq";
import { generateProgress, updateProgress } from "@/services/progressService";
import { logger } from "@/utils/logger/logger.node";

export const progressWorker = new Worker("progressQueue", async (job) => {
    try {
        if (job.name === "generate-progress") {
            const { userId, courseId } = job.data;
            await generateProgress(userId, courseId);
            logger.info(`Progress generate Worker called for user ${userId} and course ${courseId}`);
        }
        if (job.name === "update-progress") {
            const { userId, courseId, lessonId, progressValue } = job.data;
            await updateProgress(userId, courseId, lessonId, progressValue);
            logger.info(`Progress update Worker called for user ${userId} and course ${courseId}`);
        }
    }
    catch (error: any) {


        logger.error("Worker failed", { jobId: job.id, error });
        throw error;
    }
}, {
    connection: {
        url: process.env.UPSTASH_REDIS_URL,
    }
}
)