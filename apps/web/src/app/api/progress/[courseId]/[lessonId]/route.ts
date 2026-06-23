import { connectDB } from "@/config/mongoDB/db";
import { progressQueue } from "@/lib/queue/progressQueue";
import {Progress} from "@repo/shared";
import { generateProgress, updateProgress } from "@/services/progressService";
import { IProgress } from "@/types/model";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { logger } from "@/utils/logger/logger.node";
import { validateMongooseId } from "@/utils/schemaValidation/idValidator/idValidator";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: CustomNextRequest, context: { params: { courseId: string, lessonId: string } }): Promise<NextResponse> {
    await connectDB();

    try {
        const { courseId, lessonId } = context.params;
        const user: ISessionUser | null = await getDataFromToken(request);
        if (!user || !user.id) {
            logger.info("Unauthorized access", { ip: request.ip });
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }
        const userId: string = user.id;
        if (!validateMongooseId({ userId, courseId, lessonId })) {
            logger.info("Invalid course or lesson ID");
            return NextResponse.json({ message: "Invalid course or lesson ID" }, { status: 400 });
        }
        if (!validateMongooseId({ userId, courseId, lessonId })) {
            logger.info("Invalid course or lesson ID");
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
    } catch (error:unknown) {
        logger.error("Error marking lesson complete:",{ error});
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `Failed to fetch progress :${message}` }, { status: 500 });
    }
}
export async function POST(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    await connectDB();
    try {
        const { courseId } = context.params;

        const user: ISessionUser | null = await getDataFromToken(request);
        if (!user || !user.id) {
            logger.info("Unauthorized access", { ip: request.ip });
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }
        const userId: string = user.id;
        if (!validateMongooseId({ userId, courseId })) {
            logger.info("Invalid IDs", { userId, courseId });
            return NextResponse.json({ message: "Invalid IDs" }, { status: 400 });
        }
        await progressQueue.add("generate-progress", { userId, courseId });
        logger.info("Progress of the Lesson created in worker");
        return NextResponse.json({ message: "Progress updated" }, { status: 202 });
    } catch (error:unknown) {

        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Progress Generation Failed", { message });
        return NextResponse.json({ message: `Failed to complete lesson :${message}` }, { status: 500 });
    }
}
export async function PUT(request: CustomNextRequest, context: { params: { courseId: string, lessonId: string } }): Promise<NextResponse> {
    await connectDB();

    try {
        const { courseId, lessonId } = context.params;
        const { progressValue } = await request.json();
        const user: ISessionUser | null = await getDataFromToken(request);
        if (!user) {
            logger.info("unauthorised access", { ip: request.ip });
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }
        const userId: string = user.id;
        if (!validateMongooseId({ userId, courseId, lessonId })) {
            logger.info("Invalid IDs", { userId, courseId, lessonId });
            return NextResponse.json({ message: "Invalid IDs" }, { status: 400 });
        }
        if (typeof progressValue !== "number" || progressValue < 0 || progressValue > 100) {
            logger.info("Invalid progress value", { progressValue });
            return NextResponse.json({ message: "Invalid progress value" }, { status: 400 });
        }
        await progressQueue.add("update-progress", { userId, courseId, lessonId, progressValue });
        logger.info("Progress of the Lesson updated in worker");
        return NextResponse.json({ message: "Progress updated" }, { status: 202 });
    } catch (error:unknown) {
        logger.error("Error updating progress:",{ error});
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `Failed to complete lesson :${message}` }, { status: 500 });
    }
}
