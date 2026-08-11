import { CLesson } from "@/types/client";
import { serializeLessons } from "@/utils/serializer/lesson.serializer";
import { connectDB, ILesson, Lesson, logger } from "@repo/shared";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";


export async function getLessonsByIdWithCache(courseId: string): Promise<CLesson[]> {
    await connectDB(process.env.MONGODB_URI!);
    try {
        const cached = await getCached<CLesson[]>(`lessons:course`, courseId);
        if (cached) return cached;
        const lessons: ILesson[] = await Lesson.find({ courseId }).lean().exec();
        const serialized = serializeLessons(lessons);
        await setCached(`lessons:course`, courseId, JSON.stringify(serialized), CACHE_TTL.MEDIUM);
        return serialized
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Something went wrong';
        logger.error("Error fetching Lessons", { message, error });
        return [];
    }
}