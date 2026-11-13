import { CLesson } from "@/types/client";
import { serializeLessons } from "@/utils/serializer/lesson.serializer";
import {
  connectDB,
  ILesson,
  Lesson,
  LESSONS_BY_COURSE,
  logger,
} from "@repo/shared/server";
import {
  CACHE_TTL,
  getCached,
  setCached,
} from "@repo/shared/config/redisConfig/cache-helper";

export async function getLessonsByIdWithCache(
  courseId: string
): Promise<CLesson[]> {
  await connectDB(process.env.MONGODB_URI!);
  try {
    const cached = await getCached<CLesson[] | string>(
      LESSONS_BY_COURSE.namespace,
      courseId
    );
    if (Array.isArray(cached)) return cached;
    if (typeof cached === "string") {
      try {
        const parsed: unknown = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
        logger.warn("Ignoring invalid cached lessons", { courseId });
      } catch (error: unknown) {
        logger.warn(
          "Unable to parse cached lessons; refreshing from database",
          {
            courseId,
            error,
          }
        );
      }
    }

    const lessons: ILesson[] = await Lesson.find({ courseId }).lean().exec();
    const serialized = serializeLessons(lessons);
    await setCached(
      LESSONS_BY_COURSE.namespace,
      courseId,
      serialized,
      CACHE_TTL.MEDIUM
    );
    return serialized;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    logger.error("Error fetching Lessons", { message, error });
    return [];
  }
}
