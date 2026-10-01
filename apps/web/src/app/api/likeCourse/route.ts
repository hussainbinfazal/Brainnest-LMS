import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextRequest, NextResponse } from "next/server";
import { checkIp, COURSE_LIKES_LIST_IP_KEY, COURSES_FILTERED_BY_PARAMS, Course, ISessionUser, IUserCourse, LIKED_COURSES_BY_USER, connectDB, logger, userCourse, validateMongooseId } from '@repo/shared/server';
import { ICourse } from '@repo/shared/server';
import { CustomNextRequest, IGetCourseByParamsResponse, IGetLikedCourseByParamsResponse } from "@/types/server";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import { serializeCourses } from "@/utils/serializer/course.Serializer";
import { Session } from "next-auth";
import { auth } from "@/auth";



export async function GET(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, COURSE_LIKES_LIST_IP_KEY.namespace, COURSE_LIKES_LIST_IP_KEY.max, COURSE_LIKES_LIST_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);

    const authSession: Session | null = await auth()
    if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
    const user: ISessionUser | null = authSession?.user;
    if (!user) {
        logger.info("Unauthorized access", { ip: ip });
        return failResponse({ message: "Unauthorized" }, 401, undefined, undefined, true)
    };
    let userId = user?.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams?.get('page') || '1') || 1;
    const limit = parseInt(searchParams?.get('limit') || '5') || 5;
    const skip = Number((page - 1)) * limit;
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || !Number.isInteger(skip) || skip < 0) {
        logger.warn("Invalid parameters for fetching courses", { page, limit, skip });
        throw new Error("Invalid parameters for fetching courses");
    };
    const cacheId = `${page}:${limit}:${skip}:${userId}`;//Dynamic Conditional Cache Key


    if (!validateMongooseId({ userId: userId })) {
        logger.warn("Invalid user id", { userId });
        return failResponse({
            message: "Unauthorized",
            likedCourses: [], currentPage: 0, hasNextPage: false, hasPrevPage: false, totalPages: 0, totalCourses: 0,
        }, 401, undefined, undefined, true)
    }
    const cached = await getCached<IGetLikedCourseByParamsResponse>(LIKED_COURSES_BY_USER.namespace, cacheId);
    if (cached) {
        logger.info("User Liked Courses fetched Succesfully from Cache", {
            courseCount: cached.likedCourses.length
        })
        return successResponse({ message: "User Liked Courses fetched Succesfully from Cache", likedCourses: cached.likedCourses, currentPage: cached.currentPage, hasNextPage: cached.hasNextPage, hasPrevPage: cached.hasPrevPage, totalPages: cached.totalPages, totalCourses: cached.totalCourses, }, 200, undefined, undefined, true)
    }
    // await invaidateCached("Courses", "all")
    // console.log("This is the url of mongodb", process.env.MONGODB_URI)
    await connectDB(process.env.MONGODB_URI!);
    try {

        const userCourses: IUserCourse[] = await userCourse.find({ userId: userId, isLiked: true }).select("courseId").lean().exec()

        //Negative caching
        if (userCourses.length === 0) {
            await setCached(LIKED_COURSES_BY_USER.namespace, cacheId, { likedCourses: [], currentPage: 0, hasNextPage: false, hasPrevPage: false, totalPages: 0, totalCourses: 0 }, CACHE_TTL.MEDIUM)
        };
        const courseIds = userCourses.map((uc) => uc.courseId);
        const courses: ICourse[] = await Course.find({
            _id: { $in: courseIds }
        })
            .populate("instructorId", "_id name email")
            .populate({
                path: "category",
                select: "name slug parent",
                populate: {
                    path: "parent",
                    select: "name slug"

                },
            })
            .skip(skip)
            .limit(limit)
            .lean({ virtuals: true })
            .exec();
        const totalCourseCount = await Course.countDocuments({ _id: { $in: courseIds } }).lean().exec();
        const totalPages = Math.ceil(totalCourseCount / limit);
        const hasNextPage: boolean = page < totalPages;
        const hasPrevPage: boolean = page > 1;
        let response = {
            likedCourses: serializeCourses(courses),
            hasNextPage,
            hasPrevPage,
            currentPage: page,
            totalPages: Math.ceil(totalCourseCount / limit),
            totalCourses: totalCourseCount
        }
        const serialized = serializeCourses(courses);
        await setCached(LIKED_COURSES_BY_USER.namespace, cacheId, response, CACHE_TTL.MEDIUM);
        logger.info("Liked User Courses fetched Succesfully from DB", {
            courseCount: serialized.length
        });
        return successResponse({ message: "Liked User Courses fetched Succesfully from DB", likedCourses: serialized, hasNextPage, hasPrevPage, currentPage: page, totalPages: Math.ceil(totalCourseCount / limit), totalCourses: totalCourseCount }, 200, undefined, undefined, true);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.log("This is the error on Fetch Paginated Courses", error, message);
        logger.error("Error fetching courses:", { error: message });
        return failResponse({ message: ` Error fetching courses` }, 500, undefined, undefined, true);
    }
}