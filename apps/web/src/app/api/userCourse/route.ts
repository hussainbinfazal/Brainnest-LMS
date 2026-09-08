import { getAllUserCourseByIdWithCache } from "@/lib/getCachedUserCourse";
import { CUserCourse } from "@/types/client";
import { CustomNextRequest } from "@/types/server";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { ISessionUser, logger, USER_COURSE_LIST } from "@repo/shared";
import { getCached } from "@repo/shared/config/redisConfig/cache-helper";
import { NextResponse } from "next/server";

export async function GET(request: CustomNextRequest): Promise<NextResponse> {

    const user: ISessionUser | null = await getDataFromToken(request);
    if (!user) {
        logger.info("Unauthorized access", { ip: request.ip });
        return NextResponse.json({ message: "Unauthorized", data: [] }, { status: 401 })
    };
    const { searchParams } = new URL(request.url);
    const userId: string | null = searchParams.get("userId");
    const cached = await getCached<CUserCourse[]>(USER_COURSE_LIST.namespace, userId!);
    if (cached) return NextResponse.json({ message: "User course route", data: cached }, { status: 200 });
    try {
        const authUserCourses = await getAllUserCourseByIdWithCache(userId!);
        logger.info("All User Courses Fetched Successfully ", { totalUserCourses: authUserCourses.length });
        return NextResponse.json({ message: "User course route" }, { status: 200 });
    } catch (error: unknown) {
        const message: string = error instanceof Error ? error.message : 'Something went wrong in User course route';
        logger.error("Error in All User course route", { error, message });
        return NextResponse.json({ message: "Something went wrong", data: [] }, { status: 500 });
    }
}