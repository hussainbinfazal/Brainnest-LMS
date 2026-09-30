import { getUploadStrategy } from "@/config/uploadConfig/upload";
import { clientLogger } from "../logger/clientLogger";
import { uploadChunkedToCloudinary } from "./uploadStrategyHybrid/uploadChunkedToCloudinary";
import { uploadDirectToCloudinary } from "./uploadStrategyHybrid/uploadDirectToCloudinary";
import { getErrorMessage } from "@repo/shared";

type uploadType = "image" | "video";
const MAX_FILE_SIZE = 100 * 1024 * 1024;

export type UploadErrorCode =
    | "INVALID_TYPE"
    | "FILE_TOO_LARGE"
    | "NO_STRATEGY"
    | "UPLOAD_FAILED";

export class UploadError extends Error {
    constructor(
        public readonly code: UploadErrorCode,
        public readonly userMessage: string,            // safe to show in UI
        public readonly context: Record<string, unknown> = {}, // for logs only
        options?: { cause?: unknown },
    ) {
        super(`[${code}] ${userMessage}`, options);
        this.name = "UploadError";
    }
}

export async function uploadFileClient(file: File, type: uploadType): Promise<string> {
    const ctx: Record<string, unknown> = {
        name: file.name, size: file.size, mime: file.type, type,
    };

    try {
        if (!file.type.startsWith(`${type}/`)) {
            throw new UploadError("INVALID_TYPE", `Please select a valid ${type} file.`, ctx);
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new UploadError("FILE_TOO_LARGE", "File is too large. Maximum size is 100 MB.", ctx);
        };
        const strategy = getUploadStrategy(file.size);
        ctx.strategy = strategy;
        const startedAt = performance.now();
        clientLogger.info("Upload started", ctx);
        let result: { url: string };
        switch (strategy) {
            case "direct": {
                result = await uploadDirectToCloudinary(file);
                break;
            }
            case "chunked": {
                clientLogger.warn("Large file, upload may take time", ctx);
                result = await uploadChunkedToCloudinary(file, type);
                break;
            }
            default:
                throw new UploadError("NO_STRATEGY", "Upload failed. Please try again.", ctx);
        }

        clientLogger.info("Upload finished", {
            ...ctx, ms: Math.round(performance.now() - startedAt),
        });
        return result.url;
    } catch (error: unknown) {
        const message = getErrorMessage(error, "Failed to upload file."); //getErrorMessage(error, "Failed to upload file.");
        const uploadError =
            error instanceof UploadError
                ? error
                : new UploadError(
                    "UPLOAD_FAILED",
                    "Upload failed. Check your connection and try again.",
                    ctx,
                    { cause: error },
                );

        clientLogger.error(uploadError.message, {
            code: uploadError.code,
            ...uploadError.context,
            cause: uploadError.cause || message,
        });
        throw uploadError;

    }


}
