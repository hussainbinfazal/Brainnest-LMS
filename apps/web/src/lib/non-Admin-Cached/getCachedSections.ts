import { CSection } from "@/types/client";
import { serializeSections } from "@/utils/serializer/section.serializer";
import {
  connectDB,
  ILesson,
  ISection,
  Lesson,
  logger,
  Section,
  SECTIONS_BY_COURSE,
} from "@repo/shared/server";
import {
  CACHE_TTL,
  getCached,
  setCached,
} from "@repo/shared/config/redisConfig/cache-helper";

export async function getSectionsByIdWithCache(
  courseId: string
): Promise<CSection[]> {
  await connectDB(process.env.MONGODB_URI!);
  try {
    const cached = await getCached<CSection[] | string>(
      SECTIONS_BY_COURSE.namespace,
      courseId
    );
    if (Array.isArray(cached)) return cached;
    if (typeof cached === "string") {
      try {
        const parsed: unknown = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
        logger.warn("Ignoring invalid cached sections", { courseId });
      } catch (error: unknown) {
        logger.warn(
          "Unable to parse cached sections; refreshing from database",
          {
            courseId,
            error,
          }
        );
      }
    }

    const sections: ISection[] = await Section.find({ courseId }).lean().exec();
    const serialized = serializeSections(sections);
    await setCached(
      SECTIONS_BY_COURSE.namespace,
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
