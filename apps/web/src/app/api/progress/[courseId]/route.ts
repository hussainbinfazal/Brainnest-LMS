import "@/config/redis/redis"; // Make sure to import this file to use redis serverless instance 
import { CProgress } from "@/types/client";
import { CustomNextRequest } from "@/types/server";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { serializeDocument } from "@/utils/serializer/serializeDocument";
import { connectDB, ILessonProgress, ISessionUser, logger, Progress, validateMongooseId } from "@repo/shared";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import { LessonProgress } from "@repo/shared";
import { NextResponse } from "next/server";
import { Types } from "mongoose";


export async function GET(request: CustomNextRequest, context: { params: { courseId: string, lessonId: string } }): Promise<NextResponse> {
    const params = await context.params;
    const courseId = Array.isArray(params.courseId)
        ? params.courseId[0]
        : params.courseId;  //Store States
    const lessonId = Array.isArray(params.lessonId)
        ? params.lessonId[0]
        : params.lessonId;  //Store States
    if (!courseId || !lessonId) {
        logger.error("Invalid course or lesson ID in progress route");
        return NextResponse.json({ message: "Invalid course or lesson ID" }, { status: 400 });
    }
    const user: ISessionUser | null = await getDataFromToken(request);
    if (!user || !user.id) {
        logger.info("Unauthorized access", { ip: request.ip });
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    const userId: string = user.id;
    let cached = await getCached<CProgress>(`progress:course`, `${userId}:${courseId}`)
    if (cached) return NextResponse.json({ message: "This is the progress of the course", response: cached }, { status: 200 });

    await connectDB(process.env.MONGODB_URI!);
    try {
        const [progress, completedLessons, allLessonsProgress] = await Promise.all([
            Progress.findOne(
                {
                    userId,
                    courseId,
                }
            ).lean().exec(),

            LessonProgress.find(
                {
                    userId,
                    courseId,
                },
                {
                    _id: 0,
                    lessonId: 1,
                    sectionId: 1,
                    completedAt: 1,
                }
            ).lean().exec(),
            LessonProgress.find(
                {
                    userId,
                    courseId,
                }
            ).lean().exec()
        ]);
        const completedLessonIds: string[] = completedLessons
            .filter((l: ILessonProgress) => l.completedAt)
            .map((l: ILessonProgress) => l.lessonId.toString());
        const response = {
            progress,
            lessonsProgress: allLessonsProgress,
            completedLessonIds,
        };
        logger.info("This is the progress of the Lesson", { progress, lessonId });
        const serializedProgress = await serializeDocument(response);
        await setCached("progress:course",
            `${userId}:${courseId}`, serializedProgress, CACHE_TTL.MEDIUM)
        return NextResponse.json({ message: "This is the progress of the lesson", response }, { status: 200 });
    } catch (error: unknown) {
        logger.error("Error marking lesson complete:", { error });
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `Failed to fetch progress :${message}` }, { status: 500 });
    }
}