import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextResponse } from "next/server";
import { logger, UPLOAD_SESSION } from '@repo/shared/server';
import { CustomNextRequest } from "@/types/server";
import { getCached, setCached, CACHE_TTL } from "@repo/shared/config/redisConfig/cache-helper";

interface ProgressData {
    uploadId: string;
    fileName: string;
    fileSize: number;
    uploadedBytes: number;
    lastChunkIndex: number;
    status: string;
    createdAt: number;
}

export async function GET(request: CustomNextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const uploadId: string | null = searchParams.get("uploadId");
        if (!uploadId) {
            return failResponse({ error: "Missing uploadId" }, 400, undefined, undefined, true);
        }
        const data = await getCached<ProgressData>(UPLOAD_SESSION.namespace, uploadId);
        if (!data) {
            return failResponse({ error: "Not found" }, 404, undefined, undefined, true);
        }
        logger.info(`Fetched upload progress for uploadId: ${uploadId}`, { data: JSON.parse(JSON.stringify(data)) });
        return successResponse((data), 200, undefined, undefined, true);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        logger.error("Error fetching upload progress:", { error: message });
        return failResponse({ error: message }, 500, undefined, undefined, true);
    }
}