import { createHash, randomBytes } from "node:crypto";

import {
  failResponse,
  successResponse,
} from "@/lib/helpers/failResponseHelper";

import { buildKey, CACHE_TTL, checkIp, checkUser, getCached, getRedisClient, logger, PASSWORD_RESET_TOKEN, PASSWORD_RESET_USER, RESET_EMAIL_IP_KEY, RESET_EMAIL_USER_KEY, setUpsertCached, UserToken } from "@repo/shared/server";
import { NextRequest, NextResponse } from "next/server";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";
import { auth } from "@/auth";
import { passJobToWorker } from "@repo/shared/server";
import { workerApiLinks } from "@/utils/workerApiLinks";

const sendResetEmailBodySchema = z.object({
  // email: z.string().email(),
  // userId: z.string(),
  emailType: z.string(),
  // token: z.string(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      logger.error("Unauthorized");
      return failResponse(
        { success: false, message: "Unauthorized" },
        401,
        undefined,
        undefined,
        true
      );
    }
    const { allowed, retryAfterSec, ip } = await checkIp(
      request,
      RESET_EMAIL_IP_KEY.namespace,
      RESET_EMAIL_IP_KEY.max,
      RESET_EMAIL_IP_KEY.windowSec
    )
    if (!allowed) {
      logger.error("Too many requests", { ip: ip });
      return failResponse(
        { message: "Too many requests" },
        429,
        undefined,
        { "Retry-After": String(retryAfterSec) },
        true
      );
    };
    const { allowed: isUserAllowed, retryAfterSec: retryAfter, userId: authUserId } = await checkUser(
      session.user.id,
      RESET_EMAIL_USER_KEY.namespace,
      RESET_EMAIL_USER_KEY.max,
      RESET_EMAIL_USER_KEY.windowSec

    );
    if (!isUserAllowed) {
      logger.warn("Too many requests", { ip: ip, userId: authUserId });
      return failResponse(
        { message: "Too many requests" },
        429,
        undefined,
        { "Retry-After": String(retryAfter) },
        true
      );
    }
    const body = await parseBody(request, sendResetEmailBodySchema);
    if (!body.ok) return body.response;
    const { emailType } = body.data;
    // await UserToken.deleteMany({
    //   userId: session.user.id,
    //   type: "password-reset",
    // })
    const resetToken: string = randomBytes(32).toString("hex");
    const hashedToken: string = createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const userRedisKey = buildKey(PASSWORD_RESET_USER.namespace, authUserId);
    const tokenRedisKey = buildKey(PASSWORD_RESET_TOKEN.namespace, hashedToken);
    const oldSaved = await getCached(PASSWORD_RESET_USER.namespace, authUserId);
    const redis = getRedisClient();
    // start an atomic transaction
    const tx = redis.multi();
    // invalidate the old token, replacing your deleteMany
    if (oldSaved) tx.del(userRedisKey);
    // store hash -> userId, expiring in 15 minutes
    tx.set(userRedisKey, authUserId, { ex: 900 });
    // track the user's current hash so the next request can invalidate it
    tx.set(tokenRedisKey, hashedToken, { ex: 900 });
    // run all three commands together
    await tx.exec();

    const emailResponse = await passJobToWorker(
      workerApiLinks.auth.sendResetEmail,
      { email: session.user.email, token: resetToken }
    );
    logger.info("Email sent successfully");
    return successResponse(
      { success: true, message: "Email sent", emailResponse },
      202,
      undefined,
      undefined,
      true
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Email error:", { message });
    return failResponse(
      { success: false, message: `Error in sending email: ${message}` },
      500,
      undefined,
      undefined,
      true
    );
  }
}




