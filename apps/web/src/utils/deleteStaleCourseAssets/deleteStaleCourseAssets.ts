import { logger } from "@repo/shared/server";
import axios from "axios";

export async function deleteStaleCourseAssets(staleUrls: string[], courseId: string): Promise<void> {
    if (staleUrls.length > 0) {
        try {
            const workerUrl = process.env.WORKER_URL;
            const internalAuthSecret = process.env.INTERNAL_AUTH_SECRET;
            if (!workerUrl || !internalAuthSecret) {
                throw new Error("WORKER_URL and INTERNAL_AUTH_SECRET must be configured");
            }

            await axios.delete(
                `${workerUrl}/cloudinary/delete-assets`,
                {
                    data: { urls: staleUrls },
                    headers: { "x-internal-secret": internalAuthSecret },
                    timeout: 5000,
                }
            );
        } catch (error: unknown) {
            logger.error("Failed to delete stale course assets", {
                courseId,
                message: error instanceof Error ? error.message : String(error),
            });
        }
    }
}