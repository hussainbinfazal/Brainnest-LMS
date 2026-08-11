import { CLesson, CSection } from "@/types/client";
import { serializeLessons } from "@/utils/serializer/lesson.serializer";
import { serializeSections } from "@/utils/serializer/section.serializer";
import { connectDB, ILesson, ISection, Lesson, logger, Section } from "@repo/shared";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";



export async function getSectionsByIdWithCache(courseId: string): Promise<CSection[]> {
    await connectDB(process.env.MONGODB_URI!);
    try {
        const cached = await getCached<CSection[]>(`sections:course`, courseId);
        if (cached) return cached;
        const sections: ISection[] = await Section.find({ courseId }).lean().exec();
        const serialized = serializeSections(sections);
        await setCached(`sections:course`, courseId, JSON.stringify(serialized), CACHE_TTL.MEDIUM);
        return serialized
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Something went wrong';
        logger.error("Error fetching Lessons", { message, error });
        return [];
    }
}