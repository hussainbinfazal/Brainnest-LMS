import { Worker } from "bullmq";
import { ioRedis } from "@/config/redis/redis";
import { generateCertificate } from "@/services/certficateService";
import { logger } from "@/utils/logger/logger.node";

new Worker("certificateQueue", async (job) => {
    const { userId, courseId, instructorName, courseTitle, userName } = job.data;
    await generateCertificate(userName, (courseId).toString(), userId, instructorName, courseTitle);
    logger.info(`Certificate generated for user ${userId} and course ${courseId}`);
}, {
    connection: {
        url: process.env.UPSTASH_REDIS_URL
    }
})