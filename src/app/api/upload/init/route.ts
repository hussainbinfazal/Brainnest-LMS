import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { logger } from "@/utils/logger/logger.node";
import { redisClient } from "@/config/redis/redis";


export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    try {
        const authUser: ISessionUser | null = await getDataFromToken(request)
        if (!authUser) {
            logger.warn(`Unauthorized access attempt from IP: ${request.ip}`);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json()
        const { fileName, fileSize, type } = body
        if (type !== "image" && type !== "video") {
            logger.warn(`Invalid file type upload attempt by user ${authUser.id} from IP: ${request.ip}`);
            return NextResponse.json({ error: "Invalid file type. Only 'image' and 'video' are allowed." }, { status: 400 });
        }

        const uploadId: string = crypto.randomUUID();
        const data = {
            uploadId,
            fileName,
            fileSize,
            uploadedBytes: 0,
            lastChunkIndex: 0,
            status: "uploading",
            createdAt: Date.now()
        }
        await redisClient.set(`upload:${uploadId}`, JSON.stringify(data) as string, { ex: 3600 }) // 1 hour expiration
        logger.info(`Initialized upload session for user ${authUser.id} with uploadId: ${uploadId} from IP: ${request.ip}`);
        return NextResponse.json({
            uploadId
        }, { status: 200 })

    } catch (error: any) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        logger.error("Signature generation failed:", { error: message });
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
