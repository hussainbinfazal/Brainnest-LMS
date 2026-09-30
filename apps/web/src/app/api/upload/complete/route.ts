import { NextResponse } from "next/server";
import { checkIp, logger, UPLOAD_COMPLETE_IP_KEY, UPLOAD_SESSION } from '@repo/shared/server';
import { CustomNextRequest } from "@/types/server";
import { getCached, setCached, CACHE_TTL } from "@repo/shared/config/redisConfig/cache-helper";
import { failResponse } from "@/lib/helpers/failResponseHelper";

interface UploadSession {
    uploadId: string;
    fileName: string;
    fileSize: number;
    uploadedBytes: number;
    lastChunkIndex: number;
    status: string;
    createdAt: number;
}

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    try {
        const { allowed, remaining, retryAfterSec, ip } = await checkIp(request, UPLOAD_COMPLETE_IP_KEY.namespace, UPLOAD_COMPLETE_IP_KEY.max, UPLOAD_COMPLETE_IP_KEY.windowSec); /// rate limit

        if (!allowed) {
            return failResponse(`Too many requests. Try again in ${retryAfterSec} seconds.`, 429, "RATE_LIMITED", { "Retry-After": String(retryAfterSec) });
        };
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return failResponse("Invalid request body.", 400);
        }
        const { uploadId, url } = await request.json();
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

        logger.info(`Upload completed for uploadId: `, { uploadId, url });
        return NextResponse.json({ message: "Upload marked as completed", url }, { status: 200 });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        logger.error("Error completing upload:", { error: message });
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
