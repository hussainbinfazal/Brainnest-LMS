import { NextResponse } from "next/server";
import { redisClient } from "@/config/redis/redis";
import { logger } from "@/utils/logger/logger";
import { CustomNextRequest } from "@/types/server";


export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    try {
        const { uploadId, url } = await request.json();
        const key: string = `upload:${uploadId}`;
        const existing: {
            uploadId: string,
            fileName: string,
            fileSize: number,
            uploadedBytes: number,
            lastChunkIndex: number,
            status: string,
            createdAt: number

        } | null = await redisClient.get(key);
        if (!existing) {
            return NextResponse.json({ error: "Upload session not found" }, { status: 404 });
        }
        const data: {
            uploadId: string,
            fileName: string,
            fileSize: number,
            uploadedBytes: number,
            lastChunkIndex: number,
            status: string,
            createdAt: number
        } = JSON.parse(JSON.stringify(existing));
        const updated = {
            ...data,
            status: "completed",
            url
        }
        await redisClient.set(key, JSON.stringify(updated) as string, { ex: 3600 }) // 1 hour expiration
        logger.info(`Upload completed for uploadId: ${uploadId}`, { url });
        return NextResponse.json({ message: "Upload marked as completed", url }, { status: 200 })

    } catch (error: any) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        logger.error("Error completing upload:", { error: message });
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
