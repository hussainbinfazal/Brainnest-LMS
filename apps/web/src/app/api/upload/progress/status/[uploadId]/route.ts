import { NextResponse } from "next/server";
import { logger } from "@repo/shared";
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
            return NextResponse.json({ error: "Missing uploadId" }, { status: 400 });
        }
        const data = await getCached<ProgressData>(`upload`, uploadId);
        if (!data) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        logger.info(`Fetched upload progress for uploadId: ${uploadId}`, { data: JSON.parse(JSON.stringify(data)) });
        return NextResponse.json((data));
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        logger.error("Error fetching upload progress:", { error: message });
        return NextResponse.json({ error: message }, { status: 500 });
    }
}