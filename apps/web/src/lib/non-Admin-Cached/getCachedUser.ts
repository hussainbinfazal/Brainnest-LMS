import { CAuthUser } from "@/types/client";
import { serializeDocument } from "@/utils/serializer/serializeDocument";
import { CACHE_TTL, connectDB, Course, getCached, invalidateCached, IUser, logger, setCached, User, USER_BY_ID, validateMongooseId } from "@repo/shared/server";


export async function getUserByIdWithCache(
    userId: string
): Promise<CAuthUser | null> {
    if (!validateMongooseId({ userId })) {
        logger.warn("Invalid user Id", { userId });
        throw new Error(`Invalid User Id ${userId}`);
    }
    await invalidateCached(USER_BY_ID.namespace, userId);
    const cached = await getCached<CAuthUser>(USER_BY_ID.namespace, userId);
    if (cached) {
        logger.info("1. User fetched from cache", { cached });
        return cached;
    }

    await connectDB(process.env.MONGODB_URI!);
    try {
        const user = await User.findOne({
            _id: userId,
        }).select('-password')
            .lean({ virtuals: true })
            .exec();
        if (!user) {
            logger.warn("User not found", { userId });
            return null;
        }
        // console.log("1. MONGODB RESULT:", course.instructorId);
        const serializedUser = serializeDocument(user);
        // console.log("2. SERIALIZED:", serialized.instructorId);
        // console.log(
        //     "3. BEFORE REDIS:",
        //     JSON.stringify(serialized.instructorId, null, 2)
        // );
        await setCached(
            USER_BY_ID.namespace,
            userId,
            serializedUser,
            CACHE_TTL.MEDIUM
        );
        logger.info("Course fetched successfully", { courseCount: serializedUser });
        return serializedUser;
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : "Something went wrong";
        logger.error("Error fetching course", {
            message,
            cachedCourse: cached,
            error,
        });
        return null;
    }
}