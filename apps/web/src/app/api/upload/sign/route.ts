import { getClientIp } from "@repo/shared/utils/getClientIp";
import { NextResponse } from "next/server";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { logger } from "@/utils/logger/logger.node";
import { Session } from "next-auth";
import { auth } from "@/auth";
import cloudinary from "@repo/shared/config/cloudinary/cloudinary";
import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { checkIp, checkUser, UPLOAD_SIGN_USER_KEY } from "@repo/shared/server";
export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    let ip = "unknown";
    try {
        const { allowed, remaining, retryAfterSec, ip: requestIp } = await checkIp(request, UPLOAD_SIGN_USER_KEY.namespace, UPLOAD_SIGN_USER_KEY.max, UPLOAD_SIGN_USER_KEY.windowSec); /// rate limit
        ip = requestIp
        if (!allowed) {
            return failResponse(
                `Too many requests. Try again in ${retryAfterSec} seconds.`,
                429, "RATE_LIMITED", { "Retry-After": String(retryAfterSec) },
            );
        }
        const authSession: Session | null = await auth()//  check user session
        if (!authSession) return failResponse("Unauthorized", 401); //Check if user is authenticated, if not return 401
        const authUser: ISessionUser | null = authSession?.user; ///User in session 
        if (!authUser) {
            logger.warn(`Unauthorized access attempt from IP`, { ip });
            return failResponse("Unauthorized", 401);
        };
        const userLimit = await checkUser(authUser.id, UPLOAD_SIGN_USER_KEY.namespace, UPLOAD_SIGN_USER_KEY.max, UPLOAD_SIGN_USER_KEY.windowSec);
        if (!userLimit.allowed) {
            return failResponse(
                `Too many requests. Try again in ${userLimit.retryAfterSec} seconds.`,
                429, "RATE_LIMITED", { "Retry-After": String(userLimit.retryAfterSec) },
            );
        }
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return failResponse("Invalid request body.", 400);
        }
        const { type } = (body ?? {}) as Record<string, unknown>;
        if (type !== "image" && type !== "video") {
            logger.warn(`Invalid file type upload attempt by user ${authUser.id} from IP: ${ip}`);
            return failResponse("Invalid file type. Only 'image' and 'video' are allowed.", 400);
        }

        let timestamp: number = Math.floor(new Date().getTime() / 1000);
        let paramsToSign;
        if (type === "image") {
            paramsToSign = {
                timestamp,
                folder: process.env.CLOUDINARY_UPLOAD_FOLDER,
                resource_type: "image",
                allowed_formats: "jpg,jpeg,png,webp,gif",
            }
        } else if (type === "video") {
            paramsToSign = {
                timestamp,
                folder: process.env.CLOUDINARY_UPLOAD_FOLDER,
                resource_type: "video",
                allowed_formats: "mp4,mov,avi,mkv,webm"
            }
        } else {
            return failResponse(
                "Invalid file type", 400
            )
        }

        const api_Secret: string = process.env.CLOUDINARY_API_SECRET!
        const signature = cloudinary.utils.api_sign_request(paramsToSign, api_Secret);
        logger.info("Generated signature for user:", { name: authUser.id, type, ip: ip });
        const data = {
            signature,
            timestamp,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
            folder: paramsToSign.folder,
            resourceType: paramsToSign.resource_type,
            allowedFormats: paramsToSign.allowed_formats
        }
        return successResponse(data, "Signature generated successfully", 200)

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        logger.error("Signature generation failed:", { error: message });
        return failResponse("Signature generation failed", 500)
    }
}