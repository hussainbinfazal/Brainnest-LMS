import { CLessonProgress, CProgress } from "@/types/client";
import { serializeLessonsProgress } from "@/utils/serializer/lessonProgress.Serializer";
import { serializeProgress } from "@/utils/serializer/progress.Serializer";
import { serializeUserCourse } from "@/utils/serializer/userCourse.Serializer";
import { connectDB, ILessonProgress, IProgress, IUserCourse, logger, Progress, userCourse, validateMongooseId } from "@repo/shared";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import lessonProgress from "@repo/shared/models/Course/lessonProgressModel";

type UserProgressResult = { currentProgress: CProgress; lessons: CLessonProgress[] };
export async function getUserProgressByIdWithCache(userId: string, courseId: string): Promise<UserProgressResult | null> {

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

        const [cachedProgress, cachedLessonsProgress] = await Promise.all([
            getCached<CProgress>("userProgress", `${userId}-${courseId}`),
            getCached<CLessonProgress[]>("lessonProgress", `${userId}-${courseId}`),
        ]);
        if (cachedProgress && cachedLessonsProgress) {
            logger.info("User Progress fetched from cache");
            return { currentProgress :cachedProgress, lessons: cachedLessonsProgress };
        };

        const [authUserProgress, lessonWithStatus] = await Promise.all([
            Progress.findOne({ userId, courseId }).lean<IProgress>().exec(),
            lessonProgress.find({ userId, courseId }).lean<ILessonProgress>().exec(),
        ]);
        if (!authUserProgress) {
            logger.info("User Progress not found");
            return null;
        }
        const progressSerialized = serializeProgress(authUserProgress);
        const lessonWithStatusSerialized = serializeLessonsProgress(lessonWithStatus);
        await Promise.all([
            setCached<CProgress>("userProgress", `${userId}-${courseId}`, progressSerialized, CACHE_TTL.MEDIUM),
            setCached<CLessonProgress[]>("lessonProgress", `${userId}-${courseId}`, lessonWithStatusSerialized, CACHE_TTL.MEDIUM),
        ]);
        console.log("USER PROGRESS DEBUG:", {
            userId,
            courseId,
            userProgressId: authUserProgress?._id,
        });
        logger.info("User Progress fetched successfully");
        return { currentProgress: progressSerialized, lessons: lessonWithStatusSerialized };


    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Something went wrong';
        logger.error("Error fetching User Progress", { message, error });
        return null;
    }

}