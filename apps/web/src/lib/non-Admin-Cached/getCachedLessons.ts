import { CLesson } from "@/types/client";
import {
  serializeLesson,
  serializeLessons,
} from "@/utils/serializer/lesson.serializer";
import {
  connectDB,
  ILesson,
  Lesson,
  LESSONS_BY_COURSE,
  LESSONS_BY_LESSONID,
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
export async function getLessonByIdWithCache(
  courseId: string,
  lessonId: string
): Promise<CLesson | null> {
  await connectDB(process.env.MONGODB_URI!);
  try {
    const cached = await getCached<CLesson | string>(
      LESSONS_BY_LESSONID.namespace,
      lessonId
    );
    if (cached && typeof cached !== "string") return cached;
    if (typeof cached === "string") {
      try {
        const parsed: unknown = JSON.parse(cached);
        if (
          parsed !== null &&
          typeof parsed === "object" &&
          !Array.isArray(parsed)
        ) {
          return parsed as CLesson;
        }
        logger.warn("Ignoring invalid cached lesson", { courseId, lessonId });
      } catch (error: unknown) {
        logger.warn(
          "Unable to parse cached lesson; refreshing from database",
          { courseId, lessonId, error }
        );
      }
    }

    const lesson: ILesson | null = await Lesson.findOne({
      _id: lessonId,
      courseId,
    })
      .lean()
      .exec();
    if (!lesson) return null;
    const serialized = serializeLesson(lesson);
    await setCached(
      LESSONS_BY_LESSONID.namespace,
      lessonId,
      serialized,
      CACHE_TTL.MEDIUM
    );
    return serialized;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    logger.error("Error fetching Lessons", { message, error });
    return null;
  }
}
