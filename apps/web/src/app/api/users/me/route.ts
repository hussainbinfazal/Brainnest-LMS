import { AUTH_USER, connectDB, IUser, IUserCourse, logger, User, userCourse, } from "@repo/shared";
import { NextResponse } from "next/server";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import { CAuthUser } from "@/types/client";

//Look into this 
export async function GET(request: CustomNextRequest): Promise<NextResponse> {

  try {
    const authUser: ISessionUser | null = await getDataFromToken(request);

    if (!authUser) {
      logger.warn("Unauthorized access attempt", { ip: request.ip });
      return NextResponse.json({ message: "Missing User Details" }, { status: 401 });
    }

    const cached = await getCached<CAuthUser[]>(AUTH_USER.namespace, authUser.id);

    if (cached) {
      logger.info("User fetched from cache");
      return NextResponse.json({ message: "User fetched successfully", user: cached[0] }, { status: 200 });
    }
    await connectDB(process.env.MONGODB_URI!);
    // Get user basic info
    const userDb: IUser | null = await User.findById(authUser?.id)
      .select('-password')
      .exec();

    if (!userDb) return NextResponse.json({ message: "User not found", user: {} }, { status: 404 });
    logger.info("User fetched successfully", { userId: authUser?.id });
    await setCached(AUTH_USER.namespace, authUser.id, [userDb], CACHE_TTL.MEDIUM);
    return NextResponse.json({ message: "User fetched successfully", user: userDb }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error in getting user`, { error: error, message });
    return NextResponse.json({ message: `Error in getting` }, { status: 500 });
  }


}
