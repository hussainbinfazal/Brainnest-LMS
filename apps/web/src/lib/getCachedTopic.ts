import { CCourse, CTopic } from "@/types/client";
import { connectDB, Course, ICourse, ITopic, logger, Topic, validateMongooseId } from "@repo/shared";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";


export async function getCachedTopic(courseId: string): Promise<CTopic | null> {
    if (!validateMongooseId({ courseId })) {
        logger.warn("Invalid course id", { courseId });
        throw new Error("Invalid course Id");
    }
    await connectDB(process.env.MONGODB_URI);
    try {
        let cachedCourse = await getCached<CCourse & { topic: ITopic }>(`course`, courseId,); //Course are caching on behalf of courseId
        if (cachedCourse) {
            return (JSON.parse(cachedCourse.topic)); // return cached topic
        } else {
            //Find course for topic
            const course: ICourse & { topic: ITopic } = await Course.findById(courseId).populate("topic", "_id name slug description isActive").lean().exec();
            if (!course) {
                logger.warn("Topic not found");
                return null;
            }
            const topic: ITopic | null = course.topic;
            await setCached(`course`, courseId, JSON.stringify(course), CACHE_TTL.MEDIUM);
            await setCached(`topic`, (topic._id.toString()), JSON.stringify(topic), CACHE_TTL.MEDIUM);
            return (JSON.stringify(topic) as unknown as CTopic)
        }

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Something went wrong';
        logger.error("Error fetching course", { message, error });
        return null;


    }
}