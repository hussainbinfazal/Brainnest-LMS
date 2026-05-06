import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { logger } from "@/utils/logger/logger.node";

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    try {
        const authUser: ISessionUser | null = await getDataFromToken(request)
        if (!authUser) {
            logger.warn(`Unauthorized access attempt from IP: ${request.ip}`);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json()
        const { type } = body
        if (type !== "image" && type !== "video") {
            logger.warn(`Invalid file type upload attempt by user ${authUser.id} from IP: ${request.ip}`);
            return NextResponse.json({ error: "Invalid file type. Only 'image' and 'video' are allowed." }, { status: 400 });
        }

        let timestamp: number = Math.floor(new Date().getTime() / 1000);
        let paramsToSign;
        if (type === "image") {
            paramsToSign = {
                timestamp,
                folder: process.env.CLOUDINARY_UPLOAD_FOLDER,
                resource_type: "image",
                allowed_formats: "jpg, jpeg, png, webp, gif",
            }
        } else if (type === "video") {
            paramsToSign = {
                timestamp,
                folder: process.env.CLOUDINARY_UPLOAD_FOLDER,
                resource_type: "video",
                allowed_formats: "mp4, mov, avi, mkv, webm"
            }
        } else {
            return NextResponse.json({
                error: "Invalid file type"
            }, { status: 400 })
        }

        const api_Secret: string = process.env.CLOUDINARY_API_SECRET!
        const signature = cloudinary.utils.api_sign_request(paramsToSign, api_Secret);
        logger.info("Generated signature for user:", { name: authUser.id, type, ip: request.ip });
        return NextResponse.json({
            signature,
            timestamp,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
            folder: paramsToSign.folder,
            resourceType: paramsToSign.resource_type,

        }, { status: 200 })

    } catch (error: any) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        logger.error("Signature generation failed:", { error: message });
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
