import { CustomNextRequest } from "@/types/server";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { ISessionUser, IUserCourse, logger, USER_COURSE_DETAIL, validateMongooseId } from "@repo/shared";
import { NextRequest, NextResponse } from "next/server";
import { userCourse as UserCourse } from "@repo/shared";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import { CUserCourse } from "@/types/client";
import { serializeUserCourse, serializeUserCourses } from "@/utils/serializer/userCourse.Serializer";

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    try {
        const user: ISessionUser | null = await getDataFromToken(request);
        if (!user) {
            logger.info("Unauthorized access", { ip: request.ip });
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }
        const userId: string = user.id;
        if (!userId) return NextResponse.json({ message: "User id is required", userCourses: [] }, { status: 400 });


        const { courseIds } = await request.json();
        if (!Array.isArray(courseIds) || courseIds.length === 0) {
            return NextResponse.json({ userCourses: [] });
        }

        if (courseIds.some((id: string) => !validateMongooseId({ courseId: id }))) return NextResponse.json({ message: "Invalid course ids", userCourses: [] }, { status: 400 });

        //check Redis for every id, in parallel
        const cacheCheck: (CUserCourse | null)[] = await Promise.all(
            courseIds.map((id: string) => getCached<CUserCourse>(USER_COURSE_DETAIL.namespace, `${userId}-${id}`))
        )

        // (the ones that were null/missing in Redis)
        const uncachedCourseIds: string[] = courseIds.filter((_, i) => !cacheCheck[i]);



        // (the actual hits, already have the data)
        const cachedResult: CUserCourse[] = cacheCheck.filter(Boolean) as CUserCourse[];

        let fetchedResults: IUserCourse[] = [];
        if (uncachedCourseIds.length > 0) {
            fetchedResults = await UserCourse.find({ userId: userId, courseId: { $in: uncachedCourseIds } }).lean().exec();
        };
        const serializedFetchedResults = serializeUserCourses(fetchedResults);
        const userCourses: CUserCourse[] = [...cachedResult, ...serializedFetchedResults];
        const foundIds = new Set(fetchedResults.map(uc => uc.courseId.toString())); // new set of cache ids
        const notFoundIds: string[] = courseIds.filter((id) => !foundIds.has(id)); // return uncached courseIds

        await Promise.all([
            ...fetchedResults.map((uc: IUserCourse) => setCached(USER_COURSE_DETAIL.namespace, `${userId}-${uc.courseId}`, serializeUserCourse(uc), CACHE_TTL.MEDIUM)),
            ...notFoundIds.map((id: string) => setCached(USER_COURSE_DETAIL.namespace, `${userId}-${id}`, null, CACHE_TTL.MEDIUM))
        ])
        return NextResponse.json({
            message: "Batch user courses fetched successfully",
            userId,
            userCourses,
        }, { status: 200 });
    } catch (error: unknown) {
        const message: string = error instanceof Error ? error.message : 'Something went wrong'
        logger.error("Error fetching User Courses", { message, error });
        return NextResponse.json({ message: `Internal Server Error`, userCourses: [] }, { status: 500 });
    }
}