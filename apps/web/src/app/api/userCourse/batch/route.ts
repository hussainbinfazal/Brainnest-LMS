import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { getClientIp } from "@repo/shared/utils/getClientIp";
import { CustomNextRequest } from "@/types/server";
import { connectDB, ISessionUser, IUserCourse, logger, USER_COURSE_DETAIL, validateMongooseId } from '@repo/shared/server';
import { NextRequest, NextResponse } from "next/server";
import { userCourse as UserCourse } from '@repo/shared/server';
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import { CUserCourse } from "@/types/client";
import { serializeUserCourse, serializeUserCourses } from "@/utils/serializer/userCourse.Serializer";
import { Session } from "next-auth";
import { auth } from "@/auth";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";

const batchUserCoursesBodySchema = z.object({
    courseIds: z.array(z.string()),
});

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    const ip = getClientIp(request.headers);
    if (ip === 'unknown') logger.warn('OTP route: could not resolve client IP');
    try {
        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = authSession?.user;
        if (!user) {
            logger.info("Unauthorized access", { ip: ip });
            return failResponse({ message: "Unauthorized" }, 401, undefined, undefined, true)
        }
        const userId: string = user.id;
        if (!userId) return failResponse({ message: "User id is required", userCourses: [] }, 400, undefined, undefined, true);


        const body = await parseBody(request, batchUserCoursesBodySchema);
        if (!body.ok) return body.response;
        const { courseIds } = body.data;
        if (!Array.isArray(courseIds) || courseIds.length === 0) {
            return successResponse({ userCourses: [] }, 200, undefined, undefined, true);
        }

        if (courseIds.some((id: string) => !validateMongooseId({ courseId: id }))) return failResponse({ message: "Invalid course ids", userCourses: [] }, 400, undefined, undefined, true);

        //check Redis for every id, in parallel
        const cacheCheck: (CUserCourse | null)[] = await Promise.all(
            courseIds.map((id: string) => getCached<CUserCourse>(USER_COURSE_DETAIL.namespace, `${userId}-${id}`))
        )

        // (the ones that were null/missing in Redis)
        const uncachedCourseIds: string[] = courseIds.filter((_, i) => !cacheCheck[i]);



        // (the actual hits, already have the data)
        const cachedResult: CUserCourse[] = cacheCheck.filter(Boolean) as CUserCourse[];
        await connectDB(process.env.MONGODB_URI)
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
        return successResponse({
            message: "Batch user courses fetched successfully",
            userId,
            userCourses,
        }, 200, undefined, undefined, true);
    } catch (error: unknown) {
        const message: string = error instanceof Error ? error.message : 'Something went wrong'
        logger.error("Error fetching User Courses", { message, error });
        return failResponse({ message: `Internal Server Error`, userCourses: [] }, 500, undefined, undefined, true);
    }
}