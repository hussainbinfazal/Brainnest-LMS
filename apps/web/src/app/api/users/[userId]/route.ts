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
} from "@repo/shared/server"; // Ensure the path is correct
import bcrypt from "bcryptjs";
import { CustomNextRequest } from "@/types/server";
import { auth } from "@/auth";
import { Session } from "next-auth";
import { Types } from "mongoose";
import { PENDING_AVATAR_SUBFOLDER, TOPIC_FOLDER, uploadFolder, uploadTargetPublicId } from "@repo/shared";
import { PendingAsset } from "@/utils/CloudinaryAssets";

export const isPendingId = (
  publicId: string | undefined,
  prefix: string
): publicId is string => !!publicId && publicId.startsWith(prefix);

export const freshTarget = (folderKey: keyof typeof TOPIC_FOLDER): string =>
  // Unique id per asset, independent of array positions
  uploadTargetPublicId(
    TOPIC_FOLDER[folderKey],
    new Types.ObjectId().toString()
  );
const AVATAR_PENDING_PREFIX = uploadFolder(
  TOPIC_FOLDER["avatar"],
  PENDING_AVATAR_SUBFOLDER
);
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userId: string | string[] }> }
): Promise<NextResponse> {
  try {
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

    const pendingAssets: PendingAsset[] = [];
    // Old files to delete after a successful commit
    const staleUrls: string[] = [];

    //  Only a pending id is a new upload; an echoed existing id is ignored
    const avatarPendingId = isPendingId(profileImagePublicId, AVATAR_PENDING_PREFIX)
      ? profileImagePublicId
      : undefined;
    ///Course cover is an image ( the old code treated it as a video)
    if (profileImagePublicId) {
      pendingAssets.push({
        publicId: profileImagePublicId,
        kind: "image",
        pendingPrefix: AVATAR_PENDING_PREFIX,
        targetPublicId: freshTarget("avatar"),
      });
      // The old cover becomes garbage after commit
      if (user.profileImage) staleUrls.push(course.coverImage);
    }
    await verifyAssets(pendingAssets);

    ///Move files from pending to final
    moved = await moveAssets(pendingAssets);
    // console.log("Body", userData);
    const { profileImage, profileImagePublicId, name, phoneNumber, email: bodyEmail } = body.data.userData;
    if (!body.data.userData)
      return failResponse(
        { message: "User data is required" },
        400,
        undefined,
        undefined,
        true
      );
    const email = bodyEmail.trim().toLowerCase();
    const isEmailVerified = await getCached(USER_EMAIL_VERIFIED_FLAG.namespace, email)
    if (!isEmailVerified) {
      return failResponse({ message: "Please verify email first" }, 403, undefined, undefined, true)
    }
    await connectDB(process.env.MONGODB_URI!);

    await User.findOneAndUpdate(
      { _id: sessionUserId }, {
      $set: {
        email: bodyEmail,
        name,
        phoneNumber: phoneNumber ?? null,
        profileImage: urlOf(profileImagePublicId)
      }
    }
    )
    // console.log("This is the updated User in the backend:",user)
    logger.info("User Updated Successfully");
    return successResponse(
      { message: "User updated successfully", user },
      200,
      undefined,
      undefined,
      true
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return failResponse({ message: message }, 500, undefined, undefined, true);
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
