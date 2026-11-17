
import { auth } from "@/auth";
import { failResponse } from "@/lib/helpers/failResponseHelper";
import { buildKey, checkIp, checkUser, getRedisClient, logger, PASSWORD_RESET_TOKEN, PASSWORD_RESET_USER, setCached, USER_EMAIL_VERIFIED_FLAG, VERIFY_RESET_EMAIL_IP_KEY } from "@repo/shared/server";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

// if (!resetUserId) return failResponse({ message: "Invalid or expired link" }, 400);
const verifyResetEmailBodySchema = z.object({
    token: z.string(),
    userId: z.string(),
});
export async function PUT(request: NextRequest): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, VERIFY_RESET_EMAIL_IP_KEY.namespace, VERIFY_RESET_EMAIL_IP_KEY.max, VERIFY_RESET_EMAIL_IP_KEY.windowSec);
    if (!allowed) {
        logger.warn("Too many requests", { ip: ip });
        return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    };
    const session = await auth();
    if (!session?.user) {
        logger.error("Unauthorized");
        return failResponse({ success: false, message: "Unauthorized" }, 401, undefined, undefined, true);
    }
    const userId = session.user.id;
    const body = await parseBody(request, verifyResetEmailBodySchema);
    if (!body.ok) return body.response;
    const { token, userId: requestUserId } = body.data;
    if (requestUserId === userId) return failResponse({ message: "Invalid or expired link" }, 400);
    const { allowed: isUserAllowed, retryAfterSec: userRetryAfter, ip: userIp } = await checkUser(userId, VERIFY_RESET_EMAIL_IP_KEY.namespace, VERIFY_RESET_EMAIL_IP_KEY.max, VERIFY_RESET_EMAIL_IP_KEY.windowSec);
    if (!isUserAllowed) {
        logger.warn("Too many requests", { ip: ip });
        return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(userRetryAfter) }, true);
    };

    const redis = getRedisClient();
    const incomingHash = createHash("sha256").update(token).digest("hex");
    // read and delete in one atomic step, so the token is single-use
    const userRedisKey = buildKey(PASSWORD_RESET_USER.namespace, userId);
    const tokenRedisKey = buildKey(PASSWORD_RESET_TOKEN.namespace, incomingHash);
    const storedUserId = await redis.getdel(tokenRedisKey);
    // the token's VALUE must equal the logged-in user; null covers invalid/expired/used
    if (storedUserId !== userId) {
        // log for monitoring, never tell the client which case it was
        logger.warn("Invalid reset token attempt", { ip, userId });
        // generic 400 for every failure case
        return failResponse({ message: "Invalid or expired link" }, 400, undefined, undefined, true);
    }
    // token is valid, so clear the pending pointer (a single call, no need to read it first)
    await redis.del(userRedisKey);
    await setCached(USER_EMAIL_VERIFIED_FLAG.namespace, userId, "1", 15 * 60);
    // null means invalid, expired, or already used
    // if (!resetUserId) return failResponse({ message: "Invalid or expired link" }, 400);
    return failResponse({ success: true, message: "Email Verified Successfully" }, 200, undefined, undefined, true);
}

