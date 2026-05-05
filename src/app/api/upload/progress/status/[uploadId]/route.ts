import { NextResponse } from "next/server";
import { redisClient } from "@/config/redis/redis";
import { logger } from "@/utils/logger/logger";
import { CustomNextRequest } from "@/types/server";


export async function GET(request: CustomNextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const uploadId = searchParams.get("uploadId");
        const data = await redisClient.get(`upload:${uploadId}`);
        if (!data) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        logger.info(`Fetched upload progress for uploadId: ${uploadId}`, { data: JSON.parse(JSON.stringify(data)) });
        return NextResponse.json(JSON.parse(JSON.stringify(data)));
    } catch (error: any) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        logger.error("Error fetching upload progress:", { error: message });
        return NextResponse.json({ error: message }, { status: 500 });
    }
}