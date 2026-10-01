import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextResponse } from "next/server";
import { logger, UPLOAD_SESSION } from '@repo/shared/server';
import { CustomNextRequest } from "@/types/server";
import { getCached, setCached, CACHE_TTL } from "@repo/shared/config/redisConfig/cache-helper";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";

const updateUploadProgressBodySchema = z.object({
    uploadId: z.string(),
    uploadedBytes: z.number().nonnegative(),
    index: z.number().int().nonnegative(),
});
interface ProgressData {
    uploadId: string,
    fileName: string,
    fileSize: number,
    uploadedBytes: number,
    lastChunkIndex: number,
    status: string,
    createdAt: number
}
export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    try {
        const body = await parseBody(request, updateUploadProgressBodySchema);
        if (!body.ok) return body.response;
        const { uploadId, uploadedBytes, index } = body.data;
        if (!uploadId || uploadedBytes === undefined || index === undefined) {
            return failResponse({ error: "Missing required fields" }, 400, undefined, undefined, true);
        }


        const existing = await getCached<ProgressData>(UPLOAD_SESSION.namespace, uploadId);
        if (!existing) {
            return failResponse({ error: "Upload session not found" }, 404, undefined, undefined, true);
        }

        const updatedData = {
            ...existing,
            uploadedBytes,
            lastChunkIndex: index,

        };
        await setCached(UPLOAD_SESSION.namespace, uploadId, updatedData, CACHE_TTL.LONG) // 1 hour expiration
        logger.info(`Upload progress updated for uploadId:`, { uploadId, uploadedBytes, lastChunkIndex: index });
        return successResponse({ message: "Progress updated", "status": "success" }, 200, undefined, undefined, true)

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        logger.error("Error updating upload progress:", { error: message });
        return failResponse({ error: message }, 500, undefined, undefined, true)
    }
}