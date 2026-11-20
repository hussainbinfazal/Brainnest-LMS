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
} from "@repo/shared/server"; // Ensure the path is correct
import bcrypt from "bcryptjs";
import { CustomNextRequest } from "@/types/server";
import { auth } from "@/auth";
import { Session } from "next-auth";



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
    const { userData } = body.data;
    // console.log("Body", userData);
    const { password, name, phoneNumber } = userData;
    if (!userData)
      return failResponse(
        { message: "User data is required" },
        400,
        undefined,
        undefined,
        true
      );
    await connectDB(process.env.MONGODB_URI!);

    const user: UserDocument | null = await User.findById(userId);
    if (!user)
      return failResponse(
        { message: "User not found" },
        404,
        undefined,
        undefined,
        true
      );
    
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.name = name || user.name;
    await user.save();
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
