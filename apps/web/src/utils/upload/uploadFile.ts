import { getUploadStrategy } from "@/config/uploadConfig/upload";
import { clientLogger } from "../clientLogger/clientLogger";
import { uploadChunkedToCloudinary } from "./uploadStrategyHybrid/uploadChunkedToCloudinary";
import { uploadDirectToCloudinary } from "./uploadStrategyHybrid/uploadDirectToCloudinary";
import { getErrorMessage } from "@repo/shared";
import { MAX_FILE_SIZE, RESOURCE_TYPE, type UploadPurpose } from "@repo/shared";
import { CUploadResult, UploadOptions } from "@/types/client";
import axios from "axios";




// Per-purpose size caps, 100 MB for everything is far too much for an avatar

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


export async function uploadFileClient(file: File, purpose: UploadPurpose, opts?: UploadOptions): Promise<CUploadResult> {
    const maxSize = MAX_FILE_SIZE[purpose]
    const type = RESOURCE_TYPE[purpose]
    const ctx: Record<string, unknown> = {
        name: file.name, size: file.size, mime: file.type, purpose
    };
    try {
        if (!file.type.startsWith(`${type}/`)) {
            throw new UploadError("INVALID_TYPE", `Please select a valid ${type} file.`, ctx);
        }
        if (file.size > maxSize) {
            throw new UploadError("FILE_TOO_LARGE", `File is too large. Maximum size is ${maxSize / (1024 * 1024)} MB.`, ctx);
        };
        const strategy = getUploadStrategy(file.size);
        ctx.strategy = strategy;
        const startedAt = performance.now();
        clientLogger.info("Upload started", ctx);
        let result: CUploadResult;
        switch (strategy) {
            case "direct": {
                result = await uploadDirectToCloudinary(file, purpose, opts);
                break;
            }
            case "chunked": {
                clientLogger.warn("Large file, upload may take time", ctx);
                result = await uploadChunkedToCloudinary(file, purpose, opts);
                break;
            }
            default:
                throw new UploadError("NO_STRATEGY", "Upload failed. Please try again.", ctx);
        }

        clientLogger.info("Upload finished", {
            ...ctx, ms: Math.round(performance.now() - startedAt),
        });
        return result
    } catch (error: unknown) {
        if (axios.isCancel(error)) throw error;
        console.log('This is the error in upload file upload function client side', error)
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
