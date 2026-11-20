  import { auth } from "@/auth";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { getErrorMessage } from "@repo/shared";
import {
  CHANGE_PASSWORD_IP_KEY,
  checkIp,
  connectDB,
  logger,
  User,
} from "@repo/shared/server";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must include a lowercase letter")
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/[0-9]/, "Password must include a number")
      .regex(/[^A-Za-z0-9\s]/, "Password must include a special character"),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ["newPassword"],
    message: "New password must be different from the current password",
  });

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { allowed, retryAfterSec, ip } = await checkIp(
      request,
      CHANGE_PASSWORD_IP_KEY.namespace,
      CHANGE_PASSWORD_IP_KEY.max,
      CHANGE_PASSWORD_IP_KEY.windowSec
    );
    if (!allowed) {
      return failResponse(
        { message: "Too many requests" },
        429,
        undefined,
        { "Retry-After": String(retryAfterSec) },
        true
      );
    }

    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return failResponse(
        { message: "Unauthorized", ip },
        401,
        undefined,
        undefined,
        true
      );
    }

    const body = await parseBody(request, changePasswordBodySchema);
    if (!body.ok) return body.response;

    await connectDB(process.env.MONGODB_URI!);
    const user = await User.findById(userId).select("+password").exec();
    if (!user) {
      return failResponse(
        { message: "User not found" },
        404,
        undefined,
        undefined,
        true
      );
    }

    if (!user.password) {
      return failResponse(
        { message: "This account does not have a password to change" },
        400,
        undefined,
        undefined,
        true
      );
    }

    const currentPasswordMatches = await bcrypt.compare(
      body.data.currentPassword,
      user.password
    );
    if (!currentPasswordMatches) {
      logger.warn("Incorrect current password during password change", {
        userId,
        ip,
      });
      return failResponse(
        { message: "Current password is incorrect" },
        400,
        undefined,
        undefined,
        true
      );
    }

    user.password = await bcrypt.hash(body.data.newPassword, 12);
    await user.save();

    return successResponse(
      { message: "Password changed successfully" },
      200,
      undefined,
      undefined,
      true
    );
  } catch (error: unknown) {
    const message = getErrorMessage(error, "Failed to change password");
    logger.error("Failed to change password", { error, message });
    return failResponse(
      { message: "Unable to change password" },
      500,
      undefined,
      undefined,
      true
    );
  }
}
