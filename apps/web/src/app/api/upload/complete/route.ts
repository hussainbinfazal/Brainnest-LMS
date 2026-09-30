import { NextResponse } from "next/server";
import { checkIp, logger, UPLOAD_COMPLETE_IP_KEY, UPLOAD_SESSION } from '@repo/shared/server';
import { CustomNextRequest } from "@/types/server";
import { getCached, setCached, CACHE_TTL } from "@repo/shared/config/redisConfig/cache-helper";
import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import z from "zod";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";

interface UploadSession {
    uploadId: string;
    fileName: string;
    fileSize: number;
    uploadedBytes: number;
    lastChunkIndex: number;
    status: string;
    createdAt: number;
}
const completeRequestBodySchema: z.ZodType<{ uploadId: string; url: string }> = z.object({
    uploadId: z.string().uuid(),
    url: z.string().url("Invalid URL"),
}).strict();

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    try {
        const { allowed, remaining, retryAfterSec, ip } = await checkIp(request, UPLOAD_COMPLETE_IP_KEY.namespace, UPLOAD_COMPLETE_IP_KEY.max, UPLOAD_COMPLETE_IP_KEY.windowSec); /// rate limit

        if (!allowed) {
            return failResponse(`Too many requests. Try again in ${retryAfterSec} seconds.`, 429, "RATE_LIMITED", { "Retry-After": String(retryAfterSec) });
        };
        const body = await parseBody(request, completeRequestBodySchema); // This validate and parse the body according to the schema
        if (!body.ok) return body.response;
        const { uploadId, url } = body.data;

        if (!uploadId || !url) {
            logger.error(`Missing required fields for uploadId:`, { uploadId, url });
            return failResponse("Missing required fields", 400, "MISSING_FIELDS");
        }
        const existing = await getCached<UploadSession>(UPLOAD_SESSION.namespace, uploadId);
        if (!existing) {
            return NextResponse.json({ error: "Upload session not found" }, { status: 404 });
        }

        const updated: UploadSession & { url: string } = {
            ...existing,
            status: "completed",
            url,
        };
        await setCached(UPLOAD_SESSION.namespace, uploadId, updated, CACHE_TTL.LONG); // 1 hour expiration
        let data = { url, uploadId };
        logger.info(`Upload completed for uploadId: `, { uploadId, url });
        return successResponse(data, 200, "Upload marked as completed",);

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        logger.error("Error completing upload:", { error: message });
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
