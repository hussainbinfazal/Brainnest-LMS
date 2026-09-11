import mongoose, { QueryFilter } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { COURSES_FILTERED_BY_PARAMS, Course, IUserCourse, LIKED_COURSES_BY_USER, connectDB, logger, userCourse, validateMongooseId } from "@repo/shared";
import { ICourse } from "@repo/shared";
import { CustomNextRequest, IGetCourseByParamsResponse, IGetLikedCourseByParamsResponse } from "@/types/server";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import { serializeCourses } from "@/utils/serializer/course.Serializer";
import { getDataFromToken } from "@/utils/getDataFromToken";



export async function GET(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    const user = await getDataFromToken(request);
    if (!user) {
        logger.info("Unauthorized access", { ip: request.ip });
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
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
        return NextResponse.json({
            message: "Unauthorized",
            likedCourses: [], currentPage: 0, hasNextPage: false, hasPrevPage: false, totalPages: 0, totalCourses: 0,
        }, { status: 401 })
    }
    const cached = await getCached<IGetLikedCourseByParamsResponse>(LIKED_COURSES_BY_USER.namespace, cacheId);
    if (cached) {
        logger.info("User Liked Courses fetched Succesfully from Cache", {
            courseCount: cached.likedCourses.length
        })
        return NextResponse.json({ message: "User Liked Courses fetched Succesfully from Cache", likedCourses: cached.likedCourses, currentPage: cached.currentPage, hasNextPage: cached.hasNextPage, hasPrevPage: cached.hasPrevPage, totalPages: cached.totalPages, totalCourses: cached.totalCourses, }, { status: 200 })
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
        return NextResponse.json({ message: "Liked User Courses fetched Succesfully from DB", likedCourses: serialized, hasNextPage, hasPrevPage, currentPage: page, totalPages: Math.ceil(totalCourseCount / limit), totalCourses: totalCourseCount }, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.log("This is the error on Fetch Paginated Courses", error, message);
        logger.error("Error fetching courses:", { error: message });
        return NextResponse.json({ message: ` Error fetching courses` }, { status: 500 });
    }
}