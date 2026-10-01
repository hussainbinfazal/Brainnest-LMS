import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { getClientIp } from "@repo/shared/utils/getClientIp";
import { auth } from "@/auth";
import { getAllUserCourseByIdWithCache } from "@/lib/non-Admin-Cached/getCachedUserCourse";
import { CUserCourse } from "@/types/client";
import { CustomNextRequest } from "@/types/server";
import { ISessionUser, logger, USER_COURSE_LIST } from '@repo/shared/server';
import { getCached } from "@repo/shared/config/redisConfig/cache-helper";
import { Session } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(request: CustomNextRequest): Promise<NextResponse> {
    const ip = getClientIp(request.headers);
    if (ip === 'unknown') logger.warn('OTP route: could not resolve client IP');

    const authSession: Session | null = await auth()
    if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
    const user: ISessionUser | null = authSession?.user;
    if (!user) {
        logger.info("Unauthorized access", { ip: ip });
        return failResponse({ message: "Unauthorized", data: [] }, 401, undefined, undefined, true)
    };
    const { searchParams } = new URL(request.url);
    const userId: string | null = searchParams.get("userId");
    const cached = await getCached<CUserCourse[]>(USER_COURSE_LIST.namespace, userId!);
    if (cached) return successResponse({ message: "User course route", data: cached }, 200, undefined, undefined, true);
    try {
        const authUserCourses = await getAllUserCourseByIdWithCache(userId!);
        logger.info("All User Courses Fetched Successfully ", { totalUserCourses: authUserCourses.length });
        return successResponse({ message: "User course route", data: authUserCourses }, 200, undefined, undefined, true);
    } catch (error: unknown) {
        const message: string = error instanceof Error ? error.message : 'Something went wrong in User course route';
        logger.error("Error in All User course route", { error, message });
        return failResponse({ message: "Something went wrong", data: [] }, 500, undefined, undefined, true);
    }
}