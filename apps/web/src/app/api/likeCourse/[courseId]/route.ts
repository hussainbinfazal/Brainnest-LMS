import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
// import "@/config/redis/redis"; // Make sure to import this file to use redis serverless instance 
import { NextRequest, NextResponse } from "next/server";
import { connectDB, LIKED_COURSES_BY_USER, logger, USER_COURSE_DETAIL, USER_COURSE_LIST } from '@repo/shared/server';
import { Course, User, userCourse, IUser, validateMongooseId } from '@repo/shared/server';
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { CACHE_TTL, getCached, invalidateCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import { CUserCourse } from "@/types/client";
import { serializeUserCourse } from "@/utils/serializer/userCourse.Serializer";
import { auth } from "@/auth";
import { checkIp, COURSE_LIKE_IP_KEY } from "@repo/shared/server";
import { Session } from "next-auth";



export async function POST(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, COURSE_LIKE_IP_KEY.namespace, COURSE_LIKE_IP_KEY.max, COURSE_LIKE_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    await connectDB(process.env.MONGODB_URI!);

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
        const { courseId } = await context.params;
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
