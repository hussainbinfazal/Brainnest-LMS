import {
  failResponse,
  successResponse,
} from "@/lib/helpers/failResponseHelper";
import { NextRequest, NextResponse } from "next/server";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";

const updateUserBodySchema = z.object({
  userData: z
    .object({
      password: z.string().optional(),
      name: z.string().optional(),
      phoneNumber: z.string().optional(),
      email: z.string().email(),
      profileImage: z.string(),
      profileImagePublicId: z.string().optional(),
      finalUploadResult: z
        .object({ public_id: z.string().max(200).optional() })
        .optional(),
    })
    .passthrough(),
});
import {
  User,
  connectDB,
  IUser,
  logger,
  validateMongooseId,
  UserDocument,
  checkIp,
  UPDATE_PROFILE_IP_KEY,
  checkUser,
  FETCH_PROFILE_USER_KEY,
  FETCH_PROFILE_IP_KEY,
  ISessionUser,
  UPDATE_PROFILE_USER_KEY,
  getCached,
  USER_EMAIL_VERIFIED_FLAG,
  getRedisClient,
  USER_UPDATE_PROFILE_LOCK,
  buildKey,
  AUTH_USER,
  invalidateCached,
} from "@repo/shared/server"; // Ensure the path is correct
import bcrypt from "bcryptjs";
import { CustomNextRequest } from "@/types/server";
import { auth } from "@/auth";
import { Session } from "next-auth";
import { Types } from "mongoose";
import { isPendingId, MovedAsset, PENDING_AVATAR_SUBFOLDER, TOPIC_FOLDER, uploadFolder, uploadTargetPublicId, urlOf } from "@repo/shared";
import { moveAssets, PendingAsset, rollbackMoves, verifyAssets } from "@/utils/CloudinaryAssets";
import { freshTarget } from "../../(admin)/admin/course/[courseId]/route";
import { deleteStaleAvatarAssets } from "@/utils/deleteStaleCourseAssets/deleteStaleCourseAssets";




const AVATAR_PENDING_PREFIX = uploadFolder(
  TOPIC_FOLDER["avatar"],
  PENDING_AVATAR_SUBFOLDER
);
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userId: string | string[] }> }
): Promise<NextResponse> {
  let moved: Map<string, MovedAsset> = new Map()


  const { allowed, retryAfterSec, ip } = await checkIp(
    request,
    UPDATE_PROFILE_IP_KEY.namespace,
    UPDATE_PROFILE_IP_KEY.max,
    UPDATE_PROFILE_IP_KEY.windowSec
  );
  if (!allowed)
    return failResponse(
      { message: "Too many requests" },
      429,
      undefined,
      { "Retry-After": String(retryAfterSec) },
      true
    );
  const authSession: Session | null = await auth();
  if (!authSession)
    return failResponse(
      { message: "Unauthorized", ip: ip },
      401,
      undefined,
      undefined,
      true
    );
  const sessionUser: ISessionUser | null = authSession?.user;
  const sessionUserId: string = sessionUser.id;
  const { allowed: userAllowed, retryAfterSec: userRetryAfterSec } =
    await checkUser(
      sessionUserId,
      UPDATE_PROFILE_USER_KEY.namespace,
      UPDATE_PROFILE_USER_KEY.max,
      UPDATE_PROFILE_USER_KEY.windowSec
    );
  if (!userAllowed)
    return failResponse(
      { message: "Too many requests" },
      429,
      undefined,
      { "Retry-After": String(userRetryAfterSec) },
      true
    );
  //Redis lock key to prevent race condition 
  // Declared above the try so the finally block can see it
  let lockAcquired = false;
  // One lock key per user
  const lockKey = buildKey(USER_UPDATE_PROFILE_LOCK.namespace, sessionUserId);
  const redis = await getRedisClient();
  const gotLock = await redis.set(lockKey, "1", { nx: true, ex: 15 });
  if (!gotLock) return failResponse({ message: "Update already in progress" }, 409, undefined, undefined, true);
  // Remember that we own the lock so only we release it
  lockAcquired = true;
  // console.log("Put controller called")
  const params = await context.params;
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;
  if (!userId || !validateMongooseId({ userId })) return failResponse({
    message: "something went wrong"
  }, 400, undefined, undefined, true)

  if (sessionUserId !== userId) {
    return failResponse({ message: 'something went wrong' }, 401, undefined, undefined, true)
  }
  const body = await parseBody(request, updateUserBodySchema);
  if (!body.ok) return body.response;
  const { finalUploadResult, name, phoneNumber, email: bodyEmail } = body.data.userData;
  const profileImagePublicId =
    finalUploadResult?.public_id ??
    body.data.userData.profileImagePublicId ??
    "";
  if (!body.data.userData)
    return failResponse(
      { message: "User data is required" },
      400,
      undefined,
      undefined,
      true
    );
  try {
    await connectDB(process.env.MONGODB_URI!);
    let savedUser = await User.findOne(
      { _id: sessionUserId }
    )
    if (!savedUser) return failResponse({ message: "User not found" }, 400, undefined, undefined, true)

    // Normalize the email only when the client sent one
    const email = bodyEmail?.trim().toLowerCase();
    // Only a real change needs verification and a uniqueness check
    const emailChanged = !!email && email !== savedUser.email;
    // Run all checks BEFORE any side effect such as moving files
    if (emailChanged) {
      // Look up the verification flag for this email
      const verified = await getCached(USER_EMAIL_VERIFIED_FLAG.namespace, email);
      // Reject when the email was never verified
      if (!verified) return failResponse({ message: "Please verify email first" }, 403, undefined, undefined, true);
      // Check whether another account already owns this email
      const taken = await User.exists({ email, _id: { $ne: sessionUserId } });
      // Respond 409 on conflict instead of leaking a Mongo duplicate-key error
      if (taken) return failResponse({ message: "Email already in use" }, 409, undefined, undefined, true);
    }  //  Only a pending id is a new upload; an echoed existing id is ignored
    const pendingAssets: PendingAsset[] = [];
    // Old files to delete after a successful commit
    const staleUrls: string[] = [];
    const avatarPendingId = isPendingId(profileImagePublicId, AVATAR_PENDING_PREFIX)
      ? profileImagePublicId
      : undefined;
    ///Course cover is an image ( the old code treated it as a video)
    if (avatarPendingId) {
      pendingAssets.push({
        publicId: avatarPendingId,
        kind: "image",
        pendingPrefix: AVATAR_PENDING_PREFIX,
        targetPublicId: freshTarget("avatar"),
      });
      // The old cover becomes garbage after commit
      if (savedUser.profileImage) staleUrls.push(savedUser.profileImage);
    }
    await verifyAssets(pendingAssets);

    ///Move files from pending to final
    moved = await moveAssets(pendingAssets);
    if (avatarPendingId) {
      const movedAvatar = moved.get(avatarPendingId);
      if (!movedAvatar) {
        logger.error("Asset not present in the moved state")
        throw new Error(`No moved asset for ${avatarPendingId}`)
      };
      savedUser.profileImage = movedAvatar.url;
    };
    if (email) { savedUser.email = email }
    if (name) { savedUser.name = name }
    await savedUser.save()
    if (staleUrls.length) await deleteStaleAvatarAssets(staleUrls, savedUser._id).catch((e) => logger.warn(String(e)));
    // console.log("This is the updated User in the backend:",user)
    await invalidateCached(AUTH_USER.namespace, savedUser._id)
    logger.info("User Updated Successfully");
    return successResponse(
      { message: "User updated successfully", savedUser },
      200,
      undefined,
      undefined,
      true
    );
  } catch (error: unknown) {
    if (moved.size > 0) {
      // A failed rollback must not hide the real error
      await rollbackMoves([...moved.values()]).catch((e: unknown) =>
        logger.error("rollbackMoves failed", {
          error: e instanceof Error ? e.message : String(e),
        }),
      );
    }
    const isDupEmail =
      // Only objects have fields to read
      typeof error === "object" &&
      error !== null &&
      // 11000 is Mongo's duplicate-key code
      (error as { code?: number }).code === 11000 &&
      // keyPattern names the violated index, so other indexes are not misreported
      "email" in
      ((error as { keyPattern?: Record<string, unknown> }).keyPattern ?? {});
    // Tell the client it is a conflict, not a crash
    if (isDupEmail) {
      return failResponse(
        { message: "Email already in use" },
        409,
        undefined,
        undefined,
        true,
      );
    }
    // Log the real error for yourself
    logger.error(
      error instanceof Error ? (error.stack ?? error.message) : String(error),
    );
    // Send a generic message so internals never leak
    return failResponse(
      { message: "Internal server error" },
      500,
      undefined,
      undefined,
      true,
    );
  } finally {
    // Release the lock on every exit path, including early returns
    if (lockAcquired) await redis.del(lockKey).catch(() => undefined);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string | string[] }> }
): Promise<NextResponse> {
  try {
    await connectDB(process.env.MONGODB_URI!);
    const params = await context.params;
    const userId = Array.isArray(params.userId)
      ? params.userId[0]
      : params.userId;
    if (!userId)
      return failResponse(
        { message: "User id is required" },
        400,
        undefined,
        undefined,
        true
      );
    const user: IUser | null = await User.findByIdAndDelete(userId);
    return successResponse(
      { message: "User deleted successfully", user },
      200,
      undefined,
      undefined,
      true
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return failResponse(
      { message: `Error in deleting user:${message}` },
      500,
      undefined,
      undefined,
      true
    );
  }
}
