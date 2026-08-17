import { CUserCourse } from "@/types/client";
import { serializeUserCourse } from "@/utils/serializer/userCourse.Serializer";
import { connectDB, IUserCourse, logger, userCourse, validateMongooseId } from "@repo/shared";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";

export async function getUserCourseByIdWithCache(userId: string, courseId: string): Promise<CUserCourse | null> {
    if (!validateMongooseId({ userId: userId })) {
        logger.warn("Invalid user id", { userId });
        throw new Error("Invalid user Id");
    }
    await connectDB(process.env.MONGODB_URI!);
    try {
        if (!validateMongooseId({ courseId: courseId })) {
            logger.warn("Invalid course id", { courseId });
            throw new Error("Invalid course Id");
        }
        if (!validateMongooseId({ userId: userId })) {
            logger.warn("Invalid user id", { userId });
            throw new Error("Invalid user Id");
        }
        const cached = await getCached<CUserCourse>(`userCourses`, `${userId}-${courseId}`);
        if (cached) {
            logger.info("User Courses fetched from cache");
            return cached;
        }
        const authUserCourse: IUserCourse | null = await userCourse.findOne({ userId: userId, courseId: courseId }).lean().exec();
        if (!authUserCourse) {
            logger.info("User Courses not found");
            return null;
        }
        const serialized = serializeUserCourse(authUserCourse);
        await setCached<CUserCourse>(`userCourses`, `${userId}-${courseId}`, serialized, CACHE_TTL.MEDIUM);
        logger.info("User Courses fetched successfully");
        return serialized;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Something went wrong';
        logger.error("Error fetching User Courses", { message, error });
        return null;
    }

}