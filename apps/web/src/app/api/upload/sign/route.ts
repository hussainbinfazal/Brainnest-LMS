import { NextResponse } from "next/server";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { logger } from "@repo/shared/server";
import { Session } from "next-auth";
import { auth } from "@/auth";
import cloudinary from "@repo/shared/config/cloudinary/cloudinary";
import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { AVATAR_SIGN_IP_KEY, checkIp, checkUser, UPLOAD_SIGN_IP_KEY, UPLOAD_SIGN_USER_KEY } from "@repo/shared/server";
import { UPLOAD_POLICIES, UPLOAD_PURPOSES } from '@repo/shared';
import z from "zod";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { uploadFolder } from "@/utils/upload/uploadSubFolderCreation";
export const uploadSignRequestBodySchema = z.object({
    purpose: z.enum(UPLOAD_PURPOSES),
}).strict();

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    let ip = "unknown";
    try {
        let body = await parseBody(request, uploadSignRequestBodySchema);
        if (!body.ok) {
            return body.response
        };

        const policy = UPLOAD_POLICIES[body.data.purpose]
        const UPLOADIPKEY = policy.requiresAuth ? UPLOAD_SIGN_IP_KEY : AVATAR_SIGN_IP_KEY;
        //Rate limit by IP In every case

        const { allowed, remaining, retryAfterSec, ip: requestIp } = await checkIp(request, UPLOADIPKEY.namespace, UPLOADIPKEY.max, UPLOADIPKEY.windowSec); /// rate limit
        ip = requestIp
        if (!allowed) {
            return failResponse(
                `Too many requests. Try again in ${retryAfterSec} seconds.`,
                429, "RATE_LIMITED", { "Retry-After": String(retryAfterSec) },
            );
        }
        let userId: string | undefined;
        if (policy.requiresAuth) {
            const session = await auth();

            //No session is a clean 401, not a crash
            if (!session?.user?.id) {
                logger.warn("Anynonimus Upload in sign route")
                return failResponse("Authentication required", 401, 'UNAUTHORIZED');}
            //Role gate (adjust to however your session stores the role )
            if (policy.allowedRoles && !policy.allowedRoles.includes(session.user.role)) return failResponse("Forbideen", 403, 'FORBIDDEN')
            //Safe to read the id now
            userId = session.user.id;

            //Per user limit, only reachable when a user exists
            const userLimit = await checkUser(userId, UPLOAD_SIGN_USER_KEY.namespace, UPLOAD_SIGN_USER_KEY.max, UPLOAD_SIGN_USER_KEY.windowSec);
            if (!userLimit.allowed) return failResponse(`Too many requests. Try again in ${userLimit.retryAfterSec} seconds.`, 429, "RATE_LIMITED", { "Retry-After": String(userLimit.retryAfterSec) });


        }
        let timestamp: number = Math.floor(new Date().getTime() / 1000);
        let paramsToSign: Record<string, string | number> = {
            //Required for signature
            timestamp,
            folder: uploadFolder(policy.folder),
            allowed_formats: policy.allowedFormats,
            ...(policy.transformation && { transformation: policy.transformation }),
            ...(policy.tags && { tags: policy.tags })
        }

        const api_Secret: string = process.env.CLOUDINARY_API_SECRET!
        const signature = cloudinary.utils.api_sign_request(paramsToSign, api_Secret);
        logger.info("Generated signature for user:", { purpose: body.data.purpose, userId, ip: requestIp });
        const data = {
            signature,
            timestamp,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
            folder: paramsToSign.folder,
            resourceType: paramsToSign.resource_type,
            allowedFormats: paramsToSign.allowed_formats,
            tags: paramsToSign.tags,
            transformation: paramsToSign.transformation
        }
        return successResponse(data, 200, "Signature generated successfully")

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        logger.error("Signature generation failed:", { error: message });
        return failResponse("Signature generation failed", 500)
    }
}