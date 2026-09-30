import { NextResponse } from "next/server";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { logger } from "@/utils/logger/logger.node";
import { redisClient } from "@/config/redis/redis";
import { Session } from "next-auth";
import { auth } from "@/auth";
import { buildKey, CACHE_TTL, checkIp, checkUser, invalidateCached, setCached, UPLOAD_INIT_IP_KEY, UPLOAD_INIT_USER_KEY, UPLOAD_SESSION, UPLOAD_SESSION_ACTIVE, validateMongooseId } from "@repo/shared/server";
import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import z from "zod";


const MAX_FILE_SIZE = 100 * 1024 * 1024; // import from shared config, same value as the client
const MAX_FILENAME_LENGTH = 255;
const SESSION_TTL_SEC = 24 * 60 * 60;
const MAX_ACTIVE_SESSIONS = 3;

const uploadInitRequestBodySchema = z
    .object({
        fileName: z.string().trim().min(1).max(MAX_FILENAME_LENGTH),
        fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
        type: z.enum(["image", "video"]),
    })
    .strict();
export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    let ip = "unknown"
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
        const userId = authSession?.user?.id; /// check if user is authenticated 
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
        const { fileName, fileSize, type } = body.data; /// get file name, file size and type
        const uploadId: string = crypto.randomUUID(); /// Generate a unique uploadId
        const now = Date.now() // Get the current timestamp
        const sessionKey = buildKey(UPLOAD_SESSION.namespace, uploadId) ///Build session key
        const activeKey = buildKey(UPLOAD_SESSION_ACTIVE.namespace, userId)  //Build active session key
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

        
        /// Update the active session set
        const results = await redisClient.multi() ///Mulit for batch requests
            .zremrangebyscore(activeKey, 0, now - SESSION_TTL_SEC * 1000) ///results [0] = count of elements removed, [1] = array of removed elements
            .zadd(activeKey, { score: now, member: uploadId }) /// /// results[1] : number added
            .zcard(activeKey) /// results[2] : number of elements in the set
            .expire(activeKey, SESSION_TTL_SEC) // [3] 1 = TTL set
            .exec<[number, number | null, number, number]>()
        const activeCount = results[2];
        /// Check if the user has reached the maximum number of active sessions
        if (activeCount > MAX_ACTIVE_SESSIONS) {
            await Promise.all([
                invalidateCached(UPLOAD_SESSION.namespace, uploadId), /// Remove the uploadId from the cache
                redisClient.zrem(activeKey, uploadId), /// Remove the uploadId from the set
            ])
            logger.warn("Active upload quota hit", { userId, ip })
            return failResponse("Active upload quota hit", 429)
        }
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
    }
}
