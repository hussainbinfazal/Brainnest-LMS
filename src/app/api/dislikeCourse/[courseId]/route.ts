import { NextRequest, NextResponse } from "next/server";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { connectDB } from "@/config/mongoDB/db";
import UserCourse from "@/models/User/userCourse";
import mongoose from "mongoose";
import { ISessionUser } from "@/types/server";
import { logger } from "@/utils/logger/logger";



export async function DELETE(request: NextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    await connectDB();
    try {
        const user: ISessionUser | null = await getDataFromToken(request);
        const { courseId } = context.params;
        if (!user || !user.id) {
            logger.info("Unauthorized access");
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const userId: string = user.id;
        if (
            !mongoose.Types.ObjectId.isValid(user.id) ||
            !mongoose.Types.ObjectId.isValid(courseId)
        ) {
            logger.info("Invalid IDs", { userId, courseId });
            return NextResponse.json({ message: "Invalid IDs" }, { status: 400 });
        }

        // Update UserCourse record to mark as not liked
        const updated = await UserCourse.findOneAndUpdate(
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
        if (!updated) {
            logger.info("Already unliked or not enrolled")
            return NextResponse.json({ message: "Already unliked or not enrolled" }, { status: 404 });
        }
        logger.info("Course unliked successfully", { userId: userId, courseId });
        return NextResponse.json({ message: "Course unliked successfully" }, { status: 200 });

    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in unliking course", { error: message });
        return NextResponse.json({ message }, { status: 500 });
    }

}   
