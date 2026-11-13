import { CTopic } from "@/types/client";
import {
  connectDB,
  Course,
  ITopic,
  logger,
  validateMongooseId,
} from "@repo/shared/server";
import { serializeDocument } from "@/utils/serializer/serializeDocument";

export async function getCachedTopic(courseId: string): Promise<CTopic | null> {
  if (!validateMongooseId({ courseId })) {
    logger.warn("Invalid course id", { courseId });
    throw new Error("Invalid course Id");
  }
  try {
    await connectDB(process.env.MONGODB_URI);
    const course = await Course.findById(courseId)
      .select("topics")
      .populate<{ topics: ITopic[] }>(
        "topics",
        "_id name slug description isActive"
      )
      .lean()
      .exec();

    const topic = course?.topics[0];
    if (!topic) {
      logger.warn("Topic not found for course", { courseId });
      return null;
    }

    return serializeDocument(topic) as unknown as CTopic;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    logger.error("Error fetching course topic", { courseId, message, error });
    return null;
  }
}
