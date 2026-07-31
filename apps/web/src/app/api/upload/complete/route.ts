import { NextResponse } from "next/server";
import { logger } from "@repo/shared";
import { CustomNextRequest } from "@/types/server";
import { getCached, setCached, CACHE_TTL } from "@repo/shared/config/redisConfig/cache-helper";

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
        const { uploadId, url } = await request.json();
        const existing = await getCached<UploadSession>("upload", uploadId);
        if (!existing) {
            return NextResponse.json({ error: "Upload session not found" }, { status: 404 });
        }

        const updated: UploadSession & { url: string } = {
            ...existing,
            status: "completed",
            url,
        };
        await setCached("upload", uploadId, updated, CACHE_TTL.LONG); // 1 hour expiration

        logger.info(`Upload completed for uploadId: `, { uploadId,url });
        return NextResponse.json({ message: "Upload marked as completed", url }, { status: 200 });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        logger.error("Error completing upload:", { error: message });
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
