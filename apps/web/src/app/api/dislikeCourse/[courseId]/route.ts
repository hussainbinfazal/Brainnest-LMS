import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
// import "@/config/redis/redis"; // Make sure to import this file to use redis serverless instance 
import { NextRequest, NextResponse } from "next/server";
import { checkIp, COURSE_LIKE_IP_KEY, connectDB, userCourse, validateMongooseId, logger, USER_COURSE_DETAIL, USER_COURSE_LIST, LIKED_COURSES_BY_USER } from '@repo/shared/server';
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { serializeUserCourse } from "@/utils/serializer/userCourse.Serializer";
import { CACHE_TTL, getCached, invalidateCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import { CUserCourse } from "@/types/client";
import { Session } from "next-auth";
import { auth } from "@/auth";

export async function DELETE(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, COURSE_LIKE_IP_KEY.namespace, COURSE_LIKE_IP_KEY.max, COURSE_LIKE_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    try {
        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = authSession?.user;
        const { courseId } = await context.params;
        if (!user || !user.id) {
            logger.info("Unauthorized access", { ip: ip });
            return failResponse({ message: "Unauthorized" }, 401, undefined, undefined, true);
        }
        const userId: string = user.id;
        if (
            !validateMongooseId({ userId, courseId })
        ) {
            logger.info("Invalid IDs", { userId, courseId });
            return failResponse({ message: "Invalid IDs" }, 400, undefined, undefined, true);
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams?.get('page') || '1') || 1;
        const limit = parseInt(searchParams?.get('limit') || '5') || 5;
        const skip = Number((page - 1)) * limit;

        await connectDB(process.env.MONGODB_URI!);
        // Update UserCourse record to mark as not liked
        const updatedUserCourse = await userCourse.findOneAndUpdate(
            {
                userId: userId,
                courseId: courseId

            },
            {
                $set: {
                    isLiked: false,
                    likedAt: null,
                },
                $setOnInsert: {
                    isPurchased: false,
                },
            },
            { returnDocument: "after" }
        ).lean().exec();


        if (!updatedUserCourse) {
            logger.info("Already unliked or not enrolled")
            return failResponse({ message: "Already unliked or not enrolled" }, 404, undefined, undefined, true);
        }
        await invalidateCached(USER_COURSE_DETAIL.namespace, `${userId}-${courseId}`);
        await invalidateCached(USER_COURSE_LIST.namespace, `${userId}`);
        await invalidateCached(LIKED_COURSES_BY_USER.namespace, `${page}:${limit}:${skip}:${userId}`)
        const serializedUserCourse = serializeUserCourse(updatedUserCourse);
        await setCached<CUserCourse>(USER_COURSE_DETAIL.namespace, `${userId}-${courseId}`, serializedUserCourse, CACHE_TTL.MEDIUM);
        logger.info("Course unliked successfully", { userId: userId, courseId });
        return successResponse({ message: "Course unliked successfully", userCourse: serializedUserCourse }, 200, undefined, undefined, true);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in unliking course", { error: message });
        return failResponse({ message }, 500, undefined, undefined, true);
    }

}   
