import { CLesson } from "@/types/client";
import { serializeLessons } from "@/utils/serializer/lesson.serializer";
import { connectDB, ILesson, Lesson, LESSONS_BY_COURSE, logger } from "@repo/shared";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";


export async function getLessonsByIdWithCache(courseId: string): Promise<CLesson[]> {
    await connectDB(process.env.MONGODB_URI!);
    try {
        const cached = await getCached<CLesson[]>(LESSONS_BY_COURSE.namespace, courseId);
        if (cached) return cached;
        const lessons: ILesson[] = await Lesson.find({ courseId }).lean().exec();
        const serialized = serializeLessons(lessons);
        await setCached(LESSONS_BY_COURSE.namespace, courseId, JSON.stringify(serialized), CACHE_TTL.MEDIUM);
        return serialized
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Something went wrong';
        logger.error("Error fetching Lessons", { message, error });
        return [];
    }
}