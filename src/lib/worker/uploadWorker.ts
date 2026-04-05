import { Worker } from "bullmq";
import { logger } from "@/utils/logger/logger";
import { uploadToCloudinary } from "@/services/uploadToCloudinary";
new Worker("FilUploadQueue", async (job) => {
    const { filePath, userId } = job.data;
    logger.info(`Upload Processing upload for user ${userId} and file: ${filePath}, started`);
    await uploadToCloudinary(filePath, userId);
}, {
    connection: {
        url: process.env.UPSTASH_REDIS_URL
    }
})