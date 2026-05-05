import { NextResponse } from "next/server";
import { redisClient } from "@/config/redis/redis";
import { logger } from "@/utils/logger/logger";
import { CustomNextRequest } from "@/types/server";


export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const { uploadId, uploadedBytes, index } = body;
        if (!uploadId || uploadedBytes === undefined || index === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
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
        } = JSON.parse(JSON.stringify(existing))
        const updatedData = {
            ...data,
            uploadedBytes,
            lastChunkIndex: index,

        };
        await redisClient.set(key, JSON.stringify(updatedData) as string, { ex: 3600 }) // 1 hour expiration
        logger.info(`Upload progress updated for uploadId: ${uploadId}`, { uploadedBytes, lastChunkIndex: index });
        return NextResponse.json({ message: "Progress updated" ,"status": "success"}, { status: 200 })

    } catch (error: any) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        logger.error("Error updating upload progress:", { error: message });
        return NextResponse.json({ error: message }, { status: 500 })
    }
}