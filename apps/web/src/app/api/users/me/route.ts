import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { getClientIp } from "@repo/shared/utils/getClientIp";
import { AUTH_USER, connectDB, IUser, IUserCourse, logger, User, userCourse, } from '@repo/shared/server';
import { NextResponse } from "next/server";

import { CustomNextRequest, ISessionUser } from "@/types/server";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import { CAuthUser } from "@/types/client";
import { Session } from "next-auth";
import { auth } from "@/auth";

//Look into this 
export async function GET(request: CustomNextRequest): Promise<NextResponse> {
    const ip = getClientIp(request.headers);
    if (ip === 'unknown') logger.warn('OTP route: could not resolve client IP');

  try {
    const authSession: Session | null = await auth()
    if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
    const authUser: ISessionUser | null = authSession?.user;
    if (!authUser) {
      logger.warn("Unauthorized access attempt", { ip: ip });
      return failResponse({ message: "Missing User Details" }, 401, undefined, undefined, true);
    }

    const cached = await getCached<CAuthUser[]>(AUTH_USER.namespace, authUser.id);

    if (cached) {
      logger.info("User fetched from cache");
      return successResponse({ message: "User fetched successfully", user: cached[0] }, 200, undefined, undefined, true);
    }
    await connectDB(process.env.MONGODB_URI!);
    // user basic info
    const userDb: IUser | null = await User.findById(authUser?.id)
      .select('-password')
      .exec();

    if (!userDb) return failResponse({ message: "User not found", user: {} }, 404, undefined, undefined, true);
    logger.info("User fetched successfully", { userId: authUser?.id });
    await setCached(AUTH_USER.namespace, authUser.id, [userDb], CACHE_TTL.MEDIUM);
    return successResponse({ message: "User fetched successfully", user: userDb }, 200, undefined, undefined, true);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error in getting user`, { error: error, message });
    return failResponse({ message: `Error in getting` }, 500, undefined, undefined, true);
  }


}
