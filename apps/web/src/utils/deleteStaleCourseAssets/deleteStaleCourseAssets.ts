import { logger, passJobToWorker } from "@repo/shared/server";
import { workerApiLinks } from "../workerApiLinks";

export async function deleteStaleCourseAssets(
  staleUrls: string[],
  courseId: string
): Promise<void> {
  if (staleUrls.length > 0) {
    try {
      await passJobToWorker(
        workerApiLinks.cloudinary.deleteAssets,
        { urls: staleUrls },
        { method: "delete", timeout: 5000 }
      );
    } catch (error: unknown) {
      logger.error("Failed to delete stale course assets", {
        courseId,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
export async function deleteStaleAvatarAssets(
  staleUrls: string[],
  userId: string
): Promise<void> {
  if (staleUrls.length > 0) {
    try {
      await passJobToWorker(
        workerApiLinks.cloudinary.deleteAssets,
        { urls: staleUrls },
        { method: "delete", timeout: 5000 }
      );
    } catch (error: unknown) {
      logger.error("Failed to delete stale course assets", {
        userId,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
