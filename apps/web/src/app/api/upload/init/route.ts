import { NextResponse } from "next/server";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { logger } from "@repo/shared/server";
import { redisClient } from "@/config/redis/redis";
import { Session } from "next-auth";
import { auth } from "@/auth";
import { acquireSlot, buildKey, CACHE_TTL, checkIp, checkUser, invalidateCached, setCached, UPLOAD_INIT_IP_KEY, UPLOAD_INIT_USER_KEY, UPLOAD_SESSION, UPLOAD_SESSION_ACTIVE, validateMongooseId, releaseSlot, } from "@repo/shared/server";
import { MAX_ACTIVE_SESSIONS, MAX_FILE_SIZE, MAX_FILENAME_LENGTH, RESOURCE_TYPE, SESSION_TTL_SEC, UPLOAD_PURPOSES, } from '@repo/shared'
import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import z from "zod";


// import from shared config, same value as the client
const uploadInitRequestBodySchema = z
    .object({
        fileName: z.string().trim().min(1).max(MAX_FILENAME_LENGTH),
        fileSize: z.number().int().positive(),
        purpose: z.enum(UPLOAD_PURPOSES),
    })
    .strict()
    .superRefine(({ fileSize, purpose }, ctx) => {
        if (fileSize > MAX_FILE_SIZE[purpose]) {
            ctx.addIssue({
                code: "custom",
                path: ["fileSize"],
                message: `File exceeds the maximum size for ${purpose}.`,
            });
        }
    });

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    let ip = "unknown"
    let activeKey = ""
    let sessionKey = ""
    let userId: string | null = null
    try {
        const { allowed, remaining, retryAfterSec, ip: requestIp } = await checkIp(request, UPLOAD_INIT_IP_KEY.namespace, UPLOAD_INIT_IP_KEY.max, UPLOAD_INIT_IP_KEY.windowSec); /// rate limit
        ip = requestIp
        if (!allowed) {
            logger.info(`Rate limit exceeded for IP: ${ip}`);
            return failResponse(
                `Too many requests. Try again in ${retryAfterSec} seconds.`,
                429, "RATE_LIMITED", { "Retry-After": String(retryAfterSec) },
            );
        };


        //Auth
        const authSession: Session | null = await auth() //  check user session
        userId = authSession?.user?.id ? authSession.user.id : null; /// check if user is authenticated 
        if (!userId || !validateMongooseId({ userId }) || !authSession) {
            logger.warn(`Unauthorized access attempt from IP: ${ip}`);
            return failResponse("Unauthorized", 401, "UNAUTHORIZED");
        }
        const authUser: ISessionUser | null = authSession?.user; /// check if user is authenticated
        const userLimit = await checkUser(authUser.id, UPLOAD_INIT_USER_KEY.namespace, UPLOAD_INIT_USER_KEY.max, UPLOAD_INIT_USER_KEY.windowSec);
        if (!userLimit.allowed) {
            logger.info(`Rate limit exceeded for user`, { user: authUser.id, ip });
            return failResponse(
                `Too many requests. Try again in ${userLimit.retryAfterSec} seconds.`,
                429, "RATE_LIMITED", { "Retry-After": String(userLimit.retryAfterSec) },
            );
        };


        let body = await parseBody(request, uploadInitRequestBodySchema);
        if (!body.ok) return body.response
        const { fileName, fileSize, purpose } = body.data; /// get file name, file size and purpose
        const type = RESOURCE_TYPE[purpose];
        const uploadId: string = crypto.randomUUID(); /// Generate a unique uploadId
        const now = Date.now() // Get the current timestamp
        sessionKey = buildKey(UPLOAD_SESSION.namespace, uploadId) ///Build session key
        activeKey = buildKey(UPLOAD_SESSION_ACTIVE.namespace, userId)  //Build active session key
        const data = {
            uploadId, ///Store upload id, for further validation 
            userId, //Store user id, for ownership checks in /progress and /complete depends on this 
            type, ///Store file type
            fileName, ///Store file name
            fileSize, ///Store file size
            uploadedBytes: 0,
            lastChunkIndex: 0,
            status: "uploading",
            createdAt: Date.now()
        };
        await setCached(UPLOAD_SESSION.namespace, uploadId, JSON.stringify(data) as string, SESSION_TTL_SEC) // 1 hour expiration


        /// Check active session limit
        const ok = await acquireSlot(activeKey, userId, MAX_ACTIVE_SESSIONS, SESSION_TTL_SEC);
        if (!ok) return failResponse("Finish your current request first.", 429, "QUOTA_EXCEEDED", { "Retry-After": String(SESSION_TTL_SEC) });

        logger.info(` Upload session created`, { userId, uploadId, type, fileSize, ip }); // Log
        return successResponse(
            uploadId //data
            , 200,
            "Upload session created")

    } catch (error: unknown) {
        logger.error("Upload init fail Responseed", {
            ip,
            error: error instanceof Error ? error.message : "unknown",
        });
        return failResponse("Could not start the upload. Please try again.", 500, "SERVER_ERROR"); // generic message to the client
    } finally {
        if (userId) {
            await releaseSlot(activeKey, userId); //Release slot if user was successfully resolved
        }

    }
}
