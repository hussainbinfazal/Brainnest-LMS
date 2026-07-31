import { Course, ICourse, connectDB, logger } from "@repo/shared"
import { getCached, setCached, CACHE_TTL } from "@repo/shared/config/redisConfig/cache-helper"
import { CCourse } from "../types/client"
import { serializeCourses } from "@/utils/serializer/course.Serializer";

/**
 * Single source of truth for fetching courses with Redis caching.
 * Used by both /api/course (client-facing route) and the Home Server
 * Component (SSR), so cache shape and query logic never drift apart.
 */


export async function getCoursesWithCache(): Promise<CCourse[]> {
    const cached = await getCached<CCourse[]>("Courses", "all");
    if (cached) {
        logger.info("Courses fetched Succesfully from Cache", {
            courseCount: cached.length
        })
        return cached;
    }
    await connectDB(process.env.MONGODB_URI!);
    try {
        const courses: ICourse[] = await Course.find()
            .populate("instructorId", "name email")
            .populate({
                path: "category",
                select: "name slug parent",
                populate: {
                    path: "parent",
                    select: "name slug"

                },
            })
            .limit(50)
            .lean({ virutals: true })
            .exec();

        const serialized = serializeCourses(courses);
        await setCached("Courses", "all", serialized, CACHE_TTL.MEDIUM);
        logger.info("Courses fetched Succesfully from DB", {
            courseCount: courses.length
        })
        return serialized
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Something went wrong';
        logger.error("Error fetching courses", {message, cachedCourses:cached });
        return [];
    }
}