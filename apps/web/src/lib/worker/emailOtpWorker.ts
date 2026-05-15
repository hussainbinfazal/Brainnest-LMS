import { Worker } from "bullmq";

import { logger } from "@/utils/logger/logger.node";
import { sendEmail } from "@/services/emailOtpService";



export const emailOtpWorker = new Worker("emailOtpQueue", async (job) => {

    try {
        if (job.name === "send-otp") {
            const { userId, email, otp } = job.data;
            await sendEmail(userId, email, otp);
        }

    } catch (error: any) {
        logger.error("Worker failed", { jobId: job.id, error });
        throw error;

    }
}, {
    connection: {
        url: process.env.UPSTASH_REDIS_URL
    }
})