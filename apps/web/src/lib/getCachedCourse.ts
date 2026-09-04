import { Course, ICourse, connectDB, logger, userCourse, validateMongooseId } from "@repo/shared"
import { getCached, setCached, CACHE_TTL, invalidateCached } from "@repo/shared/config/redisConfig/cache-helper"
import { CCourse, CUserCourse } from "../types/client"
import { serializeCourse, serializeCourses } from "@/utils/serializer/course.Serializer";
import mongoose from "mongoose";
import { serializeDocument } from "@/utils/serializer/serializeDocument";
import { IGetCourseByParamsResponse } from "@/types/server";

/**
 * Single source of truth for fetching courses with Redis caching.
 * Used by both /api/course (client-facing route) and the Home Server
 * Component (SSR), so cache shape and query logic never drift apart.
 */


export async function getCoursesWithCache(): Promise<CCourse[]> {
    const cached = await getCached<CCourse[]>("courses", "all");
    if (cached) {
        logger.info("Courses fetched Succesfully from Cache", {
            courseCount: cached.length
        })
        return cached;
    }
    // await invaidateCached("Courses", "all")
    // console.log("This is the url of mongodb", process.env.MONGODB_URI)
    await connectDB(process.env.MONGODB_URI!);
    try {
        const courses: ICourse[] = await Course.find()
            .populate("instructorId", "_id name email")
            .populate({
                path: "category",
                select: "name slug parent",
                populate: {
                    path: "parent",
                    select: "name slug"

                },
            })
            .limit(50)
            .lean({ virtuals: true })
            .exec();

        const serialized = serializeCourses(courses);
        await setCached("Courses", "all", serialized, CACHE_TTL.MEDIUM);
        logger.info("Courses fetched Succesfully from DB", {
            courseCount: courses.length
        })
        return serialized
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Something went wrong';
        logger.error("Error fetching courses", { message, cachedCourses: cached, error });
        return [];
    }
};

export async function getCourseByIdWithCache(courseId: string): Promise<CCourse | null> {
    if (!validateMongooseId({ courseId: courseId })) {
        logger.warn("Invalid course Id", { courseId });
        throw new Error(`Invalid Course Id ${courseId}`)
    }
    await invalidateCached(`course`, courseId);
    const cached = await getCached<CCourse>(`course`, courseId);
    if (cached) {
        logger.info("1. Course fetched from cache", { cached });
        return cached;
    }

    await connectDB(process.env.MONGODB_URI!);
    try {
        const course: ICourse | null = await Course.findById(courseId)
            .populate("instructorId", "_id name email")
            .populate({
                path: "category",
                select: "name slug parent",
                populate: {
                    path: "parent",
                    select: "name slug"

                },
            })
            .lean({ virtuals: true })
            .exec();
        if (!course) {
            logger.warn("Course not found", { courseId });
            return null;
        }
        // console.log("1. MONGODB RESULT:", course.instructorId);
        const serialized = serializeCourse(course);
        // console.log("2. SERIALIZED:", serialized.instructorId);
        // console.log(
        //     "3. BEFORE REDIS:",
        //     JSON.stringify(serialized.instructorId, null, 2)
        // );
        await setCached(`course`, courseId, serialized, CACHE_TTL.MEDIUM);
        logger.info("Course fetched successfully", { courseCount: serialized });
        return serialized;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Something went wrong';
        logger.error("Error fetching course", { message, cachedCourse: cached, error });
        return null;
    }
}

export async function getReleatedCoursesWithCache(courseId: string): Promise<CCourse[]> {
    if (!validateMongooseId({ courseId: courseId })) {
        logger.warn("Invalid course id", { courseId });
    }
    const cached = await getCached<CCourse[]>(`relatedCourses`, courseId);
    if (cached) {
        logger.info("Related Courses fetched from cache");
        return cached;
    }
    // await invalidateCached(`relatedCourses`, courseId)



    await connectDB(process.env.MONGODB_URI!);
    try {
        const relatedCourses: ICourse[] = await Course.find({ category: courseId }).limit(5).lean().exec();
        const serialized = serializeCourses(relatedCourses);
        await setCached(`relatedCourses`, courseId, serialized, CACHE_TTL.MEDIUM);
        logger.info("Related Courses fetched successfully", { courseCount: serialized.length });
        return serialized;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Something went wrong';
        logger.error("Error fetching related Courses", { message, cachedRelatedCourses: cached, error });
        return [];
    }
}

export async function getCourseByParamsWithCache(page: number, limit: number, skip: number): Promise<IGetCourseByParamsResponse> {
    await connectDB(process.env.MONGODB_URI!);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || !Number.isInteger(skip) || skip < 0) {
        logger.warn("Invalid parameters for fetching courses", { page, limit, skip });
        throw new Error("Invalid parameters for fetching courses");
    };
    const cached = await getCached<IGetCourseByParamsResponse>(`coursesByParams`, `${page}-${limit}-${skip}`);
    if (cached) {
        logger.info("Courses fetched from cache", { page, limit, skip, courseCount: cached.paginatedCourses.length });
        return cached;
    };
    try {
        const [totalCourseDoc, coursesInDB] = await Promise.all([
            Course.countDocuments().lean().exec(),
            Course.find().skip(skip).limit(limit).lean().exec()
        ]);
        const totalCourses: number = totalCourseDoc;
        const courses: ICourse[] = coursesInDB;
        logger.info("Courses fetched successfully", { totalCourses, page, limit });
        const totalPages = Math.ceil(totalCourses / limit);
        const hasNextPage: boolean = page < totalPages;
        const hasPrevPage: boolean = page > 1;
        let response = {
            paginatedCourses: serializeCourses(courses),
            hasNextPage,
            hasPrevPage,
            currentPage: page,
            totalPage: Math.ceil(totalCourses / limit),
            totalCourses: totalCourses
        }
        await setCached(`coursesByParams`, `${page}-${limit}-${skip}`, response, CACHE_TTL.MEDIUM);
        logger.info("Courses cached successfully", { page, limit, skip, courseCount: response.paginatedCourses.length });
        return response;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error fetching courses:", { error: message });
        return {
            paginatedCourses: [],
            currentPage: page,
            hasNextPage: false,
            hasPrevPage: false,
            totalPage: 0,
            totalCourses: 0
        };
        // return NextResponse.json({ message: ` Error fetching courses: ${message}` }, { status: 500 });
    }
}

export interface IInstructorStats {
    totalCourses: number;
    totalEnrolled: number;
    totalReviews: number;
    totalRatings: number;

}
export async function getInstructorStatsWithCache(instructorId: string): Promise<IInstructorStats | null> {
    if (!validateMongooseId({ userId: instructorId })) {
        logger.warn("Invalid user id", { userId: instructorId });
        throw new Error("Invalid Instructor Id");
    }
    const cached = await getCached<IInstructorStats>(`instructorStats`, instructorId);
    if (cached) {
        logger.info("Instructor Stats fetched from cache");
        return cached;
    }
    // await invalidateCached(`instructorStats`, instructorId);
    await connectDB(process.env.MONGODB_URI!);
    try {
        const stats = await Course.aggregate<IInstructorStats>([
            { $match: { instructorId: new mongoose.Types.ObjectId(instructorId) } },
            {
                $group: {
                    _id: "$instructorId",
                    totalCourses: { $sum: 1 },
                    totalEnrolled: { $sum: "$enrolled" },
                    totalReviews: { $sum: "$reviews" },
                    totalRatings: { $sum: "$ratingSum" }
                }
            }
        ]);
        const serialized = serializeDocument(stats[0]);
        await setCached(`instructorStats`, instructorId, serialized, CACHE_TTL.MEDIUM);
        logger.info("Instructor Stats fetched successfully");
        if (!stats[0]) {
            logger.info("No stats found for instructor", { instructorId });
            return null;
        }
        return stats[0];
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Something went wrong';
        logger.error("Error fetching Instructor Stats", { message, cachedInstructorStats: cached, error });
        return null
    }

}
export async function getUserCourseWithCache(userId: string): Promise<CCourse[] | null> {
    if (!validateMongooseId({ userId: userId })) {
        logger.warn("Invalid user id", { userId });
        throw new Error("Invalid user Id");
    }
    const cached = await getCached<CCourse[]>(`userCourses`, userId);
    if (cached) {
        logger.info("User Courses fetched from cache");
        return cached;
    }
    await connectDB(process.env.MONGODB_URI!);
    try {
        const userCourses: ICourse[] = await Course.find({ enrolled: userId }).lean().exec();
        const serialized = serializeCourses(userCourses);
        await setCached(`userCourses`, userId, serialized, CACHE_TTL.MEDIUM);
        logger.info("User Courses fetched successfully", { courseCount: serialized.length });
        return serialized;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Something went wrong';
        logger.error("Error fetching User Courses", { message, cachedUserCourses: cached, error });
        return null;
    }
}

export async function getInstructorOtherCoursesWithCache(instructorId: string, courseId: string): Promise<CCourse[]> {
    if (!validateMongooseId({ userId: instructorId })) {
        logger.warn("Invalid user id", { userId: instructorId });
        throw new Error("Invalid Instructor Id");
    }
    const cached = await getCached<CCourse[]>(`instructorOtherCourses`, instructorId);
    if (cached) {
        logger.info("Instructor Other Courses fetched from cache");
        return cached;
    }
    await connectDB(process.env.MONGODB_URI!);
    try {
        const instructoreOtherCourses: ICourse[] = await Course.find({ _id: { $ne: courseId }, instructorId: instructorId, }).limit(5).lean().exec();
        const serialized = serializeCourses(instructoreOtherCourses);
        await setCached(`instructorOtherCourses`, instructorId, serialized, CACHE_TTL.MEDIUM);
        logger.info("Instructor Other Courses fetched successfully", { courseCount: serialized.length });
        return serialized;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Something went wrong';
        logger.error("Error fetching Instructor Other Courses", { message, cachedInstructorOtherCourses: cached, error });
        return [];
    }

}

