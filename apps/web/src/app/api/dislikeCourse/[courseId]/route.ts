import { NextRequest, NextResponse } from "next/server";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { connectDB, userCourse, validateMongooseId, logger } from "@repo/shared";
import mongoose from "mongoose";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { serializeUserCourse } from "@/utils/serializer/userCourse.Serializer";
import { CACHE_TTL, getCached, invalidateCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import { CUserCourse } from "@/types/client";

export async function DELETE(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    await connectDB(process.env.MONGODB_URI!);
    try {
        const user: ISessionUser | null = await getDataFromToken(request);
        const { courseId } = context.params;
        if (!user || !user.id) {
            logger.info("Unauthorized access", { ip: request.ip });
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const userId: string = user.id;
        if (
            !validateMongooseId({ userId, courseId })
        ) {
            logger.info("Invalid IDs", { userId, courseId });
            return NextResponse.json({ message: "Invalid IDs" }, { status: 400 });
        }

        // Update UserCourse record to mark as not liked
        const updatedUserCourse = await userCourse.findOneAndUpdate(
            {
                userId: userId,
                courseId: courseId,
                isLiked: true

            },
            {
                $set: {
                    isLiked: false,
                    likedAt: null

                }
            },
            { new: true }
        );
        if (!updatedUserCourse) {
            logger.info("Already unliked or not enrolled")
            return NextResponse.json({ message: "Already unliked or not enrolled" }, { status: 404 });
        }
        await invalidateCached(`userCourses`, `${userId}-${courseId}`);
        const serializedUserCourse = serializeUserCourse(updatedUserCourse);
        await setCached<CUserCourse>(`userCourses`, `${userId}-${courseId}`, serializedUserCourse, CACHE_TTL.MEDIUM);
        let cachedCourse = await getCached<CUserCourse>(`userCourses`, `${userId}-${courseId}`);
        logger.info("Course unliked successfully", { userId: userId, courseId });
        return NextResponse.json({ message: "Course unliked successfully", userCourse: updatedUserCourse }, { status: 200 });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in unliking course", { error: message });
        return NextResponse.json({ message }, { status: 500 });
    }

}   
