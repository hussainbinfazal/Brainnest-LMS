import { connectDB } from "@/config/mongoDB/db";
import Progress from "@/models/Course/progressModel";
import { generateProgress, updateProgress } from "@/services/progressService";
import { IProgress } from "@/types/model";
import { ISessionUser } from "@/types/server";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { logger } from "@/utils/logger/logger";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: { courseId: string, lessonId: string } }): Promise<NextResponse> {
    await connectDB();

    try {
        const { courseId, lessonId } = context.params;
        const user: ISessionUser | null = await getDataFromToken(request);
        if (!user || !user.id) {
            logger.info("Unauthorized access");
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }
        const userId: string = user.id;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            logger.info("Invalid user id");
            return NextResponse.json({ message: "Invalid user id" }, { status: 400 })
        }
        if (!courseId || !lessonId) {
            logger.info("Course and lesson IDs are required");
            return NextResponse.json({ message: "Course and lesson IDs are required" }, { status: 400 });
        }
        if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
            return NextResponse.json({ message: "Invalid course or lesson ID" }, { status: 400 });
        };
        const progress = await Progress.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    courseId: new mongoose.Types.ObjectId(courseId)
                }
            },
            {
                $unwind: "$completedLessons"
            },
            {
                $match: {
                    "completedLessons.lessonId": new mongoose.Types.ObjectId(lessonId)
                }
            },
            {
                $project: {
                    _id: 0,
                    lesson: "$completedLessons",
                    lastAccessedAt: 1
                }
            }
        ])
        logger.info("This is the progress of the Lesson", { progress, lessonId });
        return NextResponse.json({ message: "This is the progress of the lesson", progress: progress[0] }, { status: 200 });
    } catch (error: any) {
        logger.error("Error marking lesson complete:", error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `Failed to fetch progress :${message}` }, { status: 500 });
    }
}
export async function POST(request: NextRequest, context: { params: { courseId: string, lessonId: string } }): Promise<NextResponse> {
    await connectDB();

    try {
        const { courseId } = context.params;

        const user: ISessionUser | null = await getDataFromToken(request);
        if (!user || !user.id) {
            logger.info("Unauthorized access");
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }
        const userId: string = user.id;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            logger.info("Invalid user id");
            return NextResponse.json({ message: "Invalid user id" }, { status: 400 })
        }
        if (!courseId) {
            logger.info("Course and lesson IDs are required");
            return NextResponse.json({ message: "Course and lesson IDs are required" }, { status: 400 });
        }
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            logger.info("Invalid course or Lesson ID")
            return NextResponse.json({ message: "Invalid course or lesson ID" }, { status: 400 });
        };
        
        await generateProgress(userId, courseId);
        logger.info("Progress of the Lesson created in worker");
        return NextResponse.json({ message: "Progress updated" }, { status: 200 });
    } catch (error: any) {
        console.error("Error marking lesson complete:", error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `Failed to complete lesson :${message}` }, { status: 500 });
    }
}
export async function PUT(request: NextRequest, context: { params: { courseId: string, lessonId: string } }): Promise<NextResponse> {
    await connectDB();

    try {
        const { courseId, lessonId } = context.params;
        const { progressValue } = await request.json();
        const user: ISessionUser | null = await getDataFromToken(request);
        if (!user) { return NextResponse.json({ message: "Unauthorized" }, { status: 401 }) }
        const userId: string = user.id;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) { return NextResponse.json({ message: "Invalid user id" }, { status: 400 }) }
        await updateProgress(userId, courseId, lessonId, progressValue);
        logger.info("Progress of the Lesson updated in worker");
        return NextResponse.json({ message: "Progress updated" }, { status: 200 });
    } catch (error: any) {
        console.error("Error marking lesson complete:", error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `Failed to complete lesson :${message}` }, { status: 500 });
    }
}
