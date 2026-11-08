import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
// import "@/config/redis/redis"; // Make sure to import this file to use redis serverless instance 
import { NextRequest, NextResponse } from "next/server";
import { connectDB, COURSE_EXISTS, COURSE_LIKERS, COURSE_LIKERS_STATUS, getRedisClient, LIKED_COURSES_BY_USER, logger, SYNC_LIKES, USER_COURSE_DETAIL, USER_COURSE_LIST } from '@repo/shared/server';
import { Course, User, userCourse, IUser, validateMongooseId } from '@repo/shared/server';
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { buildKey, CACHE_TTL, getCached, invalidateCached, setCached, setCachedSet } from "@repo/shared/config/redisConfig/cache-helper";
import { CUserCourse } from "@/types/client";
import { serializeUserCourse } from "@/utils/serializer/userCourse.Serializer";
import { auth } from "@/auth";
import { checkIp, COURSE_LIKE_IP_KEY } from "@repo/shared/server";
import { Session } from "next-auth";
import axios from "axios";



export async function POST(request: CustomNextRequest, context: { params: Promise<{ courseId: string | string[] }> }): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, COURSE_LIKE_IP_KEY.namespace, COURSE_LIKE_IP_KEY.max, COURSE_LIKE_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);

    try {
        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = authSession?.user;
        //For Cache Keys        
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams?.get('page') || '1') || 1;
        const limit = parseInt(searchParams?.get('limit') || '5') || 5;
        const skip = Number((page - 1)) * limit;
        if (!user) {
            logger.info("Unauthorized access", { ip: ip });
            return failResponse({ message: "Unauthorized" }, 401, undefined, undefined, true)
        }
        const params = await context.params;
        const courseId = Array.isArray(params.courseId)
            ? params.courseId[0]
            : params.courseId;
        const userId: string = user.id;

        if (!userId || !validateMongooseId({ userId })) {
            logger.info("Invalid user id", { userId });
            return failResponse({ message: "Invalid user id" }, 400, undefined, undefined, true)
        }

        if (!courseId || !validateMongooseId({ courseId })) {
            logger.info("Invalid course id", { courseId });
            return failResponse({ message: "Invalid course id" }, 400, undefined, undefined, true)
        }
        // const cached = await getCached<CUserCourse>(`userCourse`, `${userId}:${courseId}`)
        // if (cached) {
        //     logger.info("This is the cached user course", { userCourse: cached });
        //     return NextResponse.json({ message: "This is the cached user course", userCourse: cached }, { status: 200 });
        // }
        await connectDB(process.env.MONGODB_URI!);
        const [userDB, courseDB, userCourseDB] = await Promise.all([
            User.exists({ _id: userId }).exec(),
            Course.exists({ _id: courseId }).select("title").lean().exec(),
            userCourse.findOne({ userId: userId, courseId: courseId }).exec()
        ])
        if (!userDB) {
            logger.info("User not found");
            return failResponse({ message: "User not found" }, 403, undefined, undefined, true);
        }
        if (!courseDB) {
            logger.info("Course not found");
            return failResponse({ message: "Course not found" }, 404, undefined, undefined, true);
        }

        // Check if already liked using UserCourse model

        if (userCourseDB && userCourseDB.isLiked) {
            logger.info("User already liked this course", { courseName: courseDB.title });
            return failResponse({ message: "User already liked this course", courseName: courseDB.title }, 400, undefined, undefined, true);
        }

        logger.info("Course liked successfully", {
            courseName: courseDB.title,
        });
        // Create or update UserCourse record
        const updatedUserCourse = await userCourse.findOneAndUpdate(
            {
                userId: userId,
                courseId: courseId
            },
            {
                $set: {
                    isLiked: true,
                    likedAt: new Date(),
                },
                $setOnInsert: {
                    isPurchased: false,
                },
            },
            { upsert: true, returnDocument: "after" }

        ).lean().exec();
        if (!updatedUserCourse) {
            return failResponse({ message: "Unable to like course" }, 500, undefined, undefined, true);
        }
        await invalidateCached(USER_COURSE_DETAIL.namespace, `${userId}-${courseId}`);
        await invalidateCached(USER_COURSE_LIST.namespace, `${userId}`);
        await invalidateCached(LIKED_COURSES_BY_USER.namespace, `${page}:${limit}:${skip}:${userId}`);
        logger.info("Course liked successfully", { courseName: courseDB.title });
        logger.info("1 BEFORE serialize");
        const serialized = serializeUserCourse(updatedUserCourse);
        logger.info("2 AFTER serialize");
        await setCached<CUserCourse>(USER_COURSE_DETAIL.namespace, `${userId}-${courseId}`, serialized, CACHE_TTL.MEDIUM);

        return successResponse({ message: "Course liked successfully", courseName: courseDB.title, userCourse: serialized }, 200, undefined, undefined, true);

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error liking course:", { error: message });
        return failResponse({ message: `Error liking course ${message}` }, 500, undefined, undefined, true);
    }
}

///New route with redis integration, only integrate this after observing traffic and replace client logic usercourse with data while receiving the api response
// export async function POST(request: CustomNextRequest, context: { params: Promise<{ courseId: string | string[] }> }): Promise<NextResponse> {
//     const { allowed, retryAfterSec, ip } = await checkIp(request, COURSE_LIKE_IP_KEY.namespace, COURSE_LIKE_IP_KEY.max, COURSE_LIKE_IP_KEY.windowSec);
//     if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);

//     try {
//         const authSession: Session | null = await auth()
//         if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
//         const user: ISessionUser | null = authSession?.user;
//         //For Cache Keys
//         const { searchParams } = new URL(request.url);
//         const page = parseInt(searchParams?.get('page') || '1') || 1;
//         const limit = parseInt(searchParams?.get('limit') || '5') || 5;
//         const skip = Number((page - 1)) * limit;
//         if (!user) {
//             logger.info("Unauthorized access", { ip: ip });
//             return failResponse({ message: "Unauthorized" }, 401, undefined, undefined, true)
//         };
//         const redisClient = await getRedisClient()
//         const params = await context.params;
//         const courseId = Array.isArray(params.courseId)
//             ? params.courseId[0]
//             : params.courseId;
//         const userId: string = user.id;

//         if (!userId || !validateMongooseId({ userId })) {
//             logger.info("Invalid user id", { userId });
//             return failResponse({ message: "Invalid user id" }, 400, undefined, undefined, true)
//         }

//         if (!courseId || !validateMongooseId({ courseId })) {
//             logger.info("Invalid course id", { courseId });
//             return failResponse({ message: "Invalid course id" }, 400, undefined, undefined, true)
//         }
//         // const cached = await getCached<CUserCourse>(`userCourse`, `${userId}:${courseId}`)
//         // if (cached) {
//         //     logger.info("This is the cached user course", { userCourse: cached });
//         //     return NextResponse.json({ message: "This is the cached user course", userCourse: cached }, { status: 200 });
//         // }

//         // Check if already liked using UserCourse model
//         let courseOk = await getCached(COURSE_EXISTS.namespace, `${courseId}`);
//         if (!courseOk) {
//             // Make sure the DB connection is open before querying
//             await connectDB(process.env.MONGODB_URI!);
//             // Check existence and soft-delete in one cheap query
//             const exists = await Course.exists({ _id: courseId, isDeleted: false });
//             // Unknown course: reject before it can pollute Redis or Mongo
//             if (!exists) return failResponse({ message: "Course not found" }, 404, undefined, undefined, true);
//             // Remember the positive result
//             await setCached(COURSE_EXISTS.namespace, courseId, "1", CACHE_TTL.MEDIUM);
//         }
//         const likersKeyId = `${courseId}`;
//         const likersKey = buildKey(COURSE_LIKERS.namespace, courseId);
//         await ensureLikersLoaded(courseId);
//         const added = await setCachedSet(COURSE_LIKERS.namespace, likersKeyId, [userId]);
//         if (added === 0) {
//             return failResponse({ message: "User already liked this course" }, 400, undefined, undefined, true);
//         }
//         const syncUserLikesId = `${courseId}`
//         await setCachedSet(SYNC_LIKES.namespace, syncUserLikesId, [courseId]);
//         const likedAt = new Date();
//         const workerUrl = process.env.WORKER_URL;
//         const internalSecret = process.env.INTERNAL_AUTH_SECRET;
//         if (!workerUrl || !internalSecret) {
//             throw new Error("WORKER_URL and INTERNAL_AUTH_SECRET must be configured");
//         }
//         try {
//             // ONE global dirty set; the members are courseIds
//             await setCachedSet(SYNC_LIKES.namespace, courseId, [courseId]);
//             // Worker only ENQUEUES and answers 202 fast; the Mongo write happens later
//             await axios.post(
//                 // Worker address from a server-only env var
//                 `${workerUrl}/like/syncLike`,
//                 // Payload the job needs; Date travels as ISO string
//                 { userId, courseId, likedAt: likedAt.toISOString() },
//                 // Secret header plus a short timeout (enqueue should take milliseconds, not 10s)
//                 { headers: { "x-internal-secret": internalSecret }, timeout: 3_000 }
//             );
//         } catch (handoffError: unknown) {
//             // Handoff failed, so UNDO the gate; otherwise the user is stuck at "already liked"
//             await redisClient.srem(likersKeyId, userId);
//             // Log the real reason for debugging
//             logger.error("Like handoff failed", { error: handoffError instanceof Error ? handoffError.message : "Unknown" });
//             // 503 tells the client it is safe to retry
//             return failResponse({ message: "Please try again" }, 503, undefined, undefined, true);
//         };
//         await invalidateCached(USER_COURSE_DETAIL.namespace, `${userId}-${courseId}`);
//         await invalidateCached(USER_COURSE_LIST.namespace, `${userId}`);
//         await invalidateCached(LIKED_COURSES_BY_USER.namespace, `${page}:${limit}:${skip}:${userId}`);
//         logger.info("Course liked successfully");
//         logger.info("1 BEFORE serialize");
//         ///Remove this add worker

//         await setCached<Partial<CUserCourse>>(USER_COURSE_DETAIL.namespace, `${userId}-${courseId}`, { isLiked: true, likedAt: likedAt }, CACHE_TTL.MEDIUM);

//         // const serialized = serializeUserCourse(updatedUserCourse);
//         // return successResponse({ message: "Course liked successfully", courseName: courseDB.title, userCourse: serialized }, 200, undefined, undefined, true);
//         return successResponse({ message: "Course liked successfully", data: { isLiked: true, likedAt: likedAt } }, 200, undefined, undefined, true);
//     } catch (error: unknown) {
//         const message = error instanceof Error ? error.message : 'Unknown error';
//         logger.error("Error liking course:", { error: message });
//         return failResponse({ message: `Error liking course ${message}` }, 500, undefined, undefined, true);
//     }
// }



// export async function ensureLikersLoaded(courseId: string): Promise<void> {

//     const readKeyId = `${courseId}:ready`
//     const readKeyNamespace = `${COURSE_LIKERS_STATUS.namespace}`
//     const value = await getCached<string>(readKeyNamespace, readKeyId);
//     if (value) return
//     // const course = await Course.findOne({ _id: courseId, isDeleted: false }).select("_id").lean().exec()
//     ///Load only the userIds of the people who liked this course
//     // if (!course) return
//     await connectDB(process.env.MONGODB_URI!);
//     const likers = await userCourse.find({ courseId, isLiked: true }).select("userId").lean().exec()
//     ///already hydrated, so skip Mongo entirely
//     if (likers.length) {
//         await setCachedSet(COURSE_LIKERS.namespace, readKeyId, likers.map(({ userId }) => userId));
//     }
//     const ids = likers.map(({ userId }) => String(userId));
//     // Define a batch size so one SADD never carries 100K+ members
//     const CHUNK = 5000;
//     // Walk through the ids one batch at a time
//     for (let i = 0; i < ids.length; i += CHUNK) {
//         // SADD only (no DEL), so concurrent hydrations and live likes cannot erase each other
//         await setCachedSet(COURSE_LIKERS.namespace, courseId, ids.slice(i, i + CHUNK));
//     }
//     await setCached(COURSE_LIKERS_STATUS.namespace, readKeyId, "1", CACHE_TTL.MEDIUM);
//     return

// }