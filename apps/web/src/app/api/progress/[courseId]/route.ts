import { CProgress } from "@/types/client";
import { CustomNextRequest } from "@/types/server";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { serializeDocument } from "@/utils/serializer/serializeDocument";
import { connectDB, ILessonCompletion, ISessionUser, logger, Progress, validateMongooseId } from "@repo/shared";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import lessonCompletion from "@repo/shared/models/Course/lessonCompletionModel";
import { NextResponse } from "next/server";


export async function GET(request: CustomNextRequest, context: { params: { courseId: string, lessonId: string } }): Promise<NextResponse> {
    const user: ISessionUser | null = await getDataFromToken(request);
    if (!user || !user.id) {
        logger.info("Unauthorized access", { ip: request.ip });
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    const userId: string = user.id;
    let cached = await getCached<CProgress>(`progress:course`, `${userId}:${context.params.courseId}`)
    if (cached) return NextResponse.json({ message: "This is the progress of the course", progress: cached }, { status: 200 });

    await connectDB(process.env.MONGODB_URI!);
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

        const [progress, completedLessons] = await Promise.all([
            Progress.findOne(
                {
                    userId,
                    courseId,
                }
            ).lean(),

            lessonCompletion.find(
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
            ).lean(),
        ]);
        const response = {
            progress: {
                completedLessonsCount:
                    progress?.completedLessonsCount ?? 0,

                percentageCompleted:
                    progress?.percentageCompleted ?? 0,

                sectionProgress:
                    progress?.sectionProgress ?? [],

                lastAccessedAt:
                    progress?.lastAccessedAt ?? null,
            },

            completedLessonIds:
                completedLessons.map(
                    (lesson: ILessonCompletion) => lesson.lessonId.toString()
                ),
        };
        logger.info("This is the progress of the Lesson", { progress, lessonId });
        const serializedProgress = JSON.stringify(response);
        await setCached("progress:course",
            `${userId}:${courseId}`, serializedProgress, CACHE_TTL.MEDIUM)
        return NextResponse.json({ message: "This is the progress of the lesson", progress: progress[0] }, { status: 200 });
    } catch (error: unknown) {
        logger.error("Error marking lesson complete:", { error });
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `Failed to fetch progress :${message}` }, { status: 500 });
    }
}