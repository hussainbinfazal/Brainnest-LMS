import { NextResponse } from "next/server";
import { logger, UPLOAD_SESSION } from "@repo/shared";
import { CustomNextRequest } from "@/types/server";
import { getCached, setCached, CACHE_TTL } from "@repo/shared/config/redisConfig/cache-helper";

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
        const body = await request.json();
        const { uploadId, uploadedBytes, index } = body;
        if (!uploadId || uploadedBytes === undefined || index === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }


        const existing = await getCached<ProgressData>(UPLOAD_SESSION.namespace, uploadId);
        if (!existing) {
            return NextResponse.json({ error: "Upload session not found" }, { status: 404 });
        }

        const updatedData = {
            ...existing,
            uploadedBytes,
            lastChunkIndex: index,

        };
        await setCached(UPLOAD_SESSION.namespace, uploadId, updatedData, CACHE_TTL.LONG) // 1 hour expiration
        logger.info(`Upload progress updated for uploadId:`, { uploadId, uploadedBytes, lastChunkIndex: index });
        return NextResponse.json({ message: "Progress updated", "status": "success" }, { status: 200 })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        logger.error("Error updating upload progress:", { error: message });
        return NextResponse.json({ error: message }, { status: 500 })
    }
}