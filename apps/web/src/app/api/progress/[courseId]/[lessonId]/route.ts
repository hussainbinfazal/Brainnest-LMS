import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { checkIp, PROGRESS_LESSON_IP_KEY } from '@repo/shared/server';
import { connectDB, ILessonProgress, IProgress, Progress } from '@repo/shared/server';
import { generateProgress, updateProgress } from "@/services/progressService";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { logger } from "@repo/shared/server";
import { validateMongooseId } from "@/utils/fieldsValidation/idValidator/idValidator";

import { Session } from "next-auth";
import { auth } from "@/auth";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";

const updateProgressBodySchema = z.object({
    progressValue: z.number().min(0).max(100),
});

// export async function GET(request: CustomNextRequest, context: { params: { courseId: string, lessonId: string } }): Promise<NextResponse> {
//     const user: ISessionUser | null = await getDataFromToken(request);
//     if (!user || !user.id) {
//         logger.info("Unauthorized access", { ip: ip });
//         return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
//     }
//     const userId: string = user.id;
//     let cached = await getCached<CProgress>(`progress`, `${userId}:${context.params.courseId}`)
//     await connectDB(process.env.MONGODB_URI!);
//     try {
//         const { courseId, lessonId } = context.params;
//         const user: ISessionUser | null = await getDataFromToken(request);
//         if (!user || !user.id) {
//             logger.info("Unauthorized access", { ip: ip });
//             return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
//         }
//         const userId: string = user.id;
//         if (!validateMongooseId({ userId, courseId, lessonId })) {
//             logger.info("Invalid course or lesson ID");
//             return NextResponse.json({ message: "Invalid course or lesson ID" }, { status: 400 });
//         }
//         if (!validateMongooseId({ userId, courseId, lessonId })) {
//             logger.info("Invalid course or lesson ID");
//             return NextResponse.json({ message: "Invalid course or lesson ID" }, { status: 400 });
//         };
//         // const progress = await Progress.aggregate([
//         //     {
//         //         $match: {
//         //             userId: new mongoose.Types.ObjectId(userId),
//         //             courseId: new mongoose.Types.ObjectId(courseId)
//         //         }
//         //     },
//         //     {
//         //         $unwind: "$completedLessons"
//         //     },
//         //     {
//         //         $match: {
//         //             "completedLessons.lessonId": new mongoose.Types.ObjectId(lessonId)
//         //         }
//         //     },
//         //     {
//         //         $project: {
//         //             _id: 0,
//         //             lesson: "$completedLessons",
//         //             lastAccessedAt: 1
//         //         }
//         //     }
//         // ])
//         const completion = await LessonCompletion.findOne(
//             {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 courseId: new mongoose.Types.ObjectId(courseId),
//                 lessonId: new mongoose.Types.ObjectId(lessonId),
//             },
//             {
//                 _id: 0,
//                 lessonId: 1,
//                 completedAt: 1,
//             }
//         ).lean();
//         logger.info("This is the progress of the Lesson", { progress, lessonId });
//         const serializedProgress = serializeProgress(progress[0]);
//         await setCached<CProgress>("progress",
//             `${userId}:${courseId}`, serializedProgress, CACHE_TTL.MEDIUM)
//         return NextResponse.json({ message: "This is the progress of the lesson", progress: progress[0] }, { status: 200 });
//     } catch (error: unknown) {
//         logger.error("Error marking lesson complete:", { error });
//         const message = error instanceof Error ? error.message : 'Unknown error';
//         return NextResponse.json({ message: `Failed to fetch progress :${message}` }, { status: 500 });
//     }
// }
export async function POST(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, PROGRESS_LESSON_IP_KEY.namespace, PROGRESS_LESSON_IP_KEY.max, PROGRESS_LESSON_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    // await connectDB(process.env.MONGODB_URI!);
    try {
        const { courseId } = context.params;

        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = authSession?.user;
        if (!user || !user.id) {
            logger.info("Unauthorized access", { ip: ip });
            return failResponse({ message: "Unauthorized" }, 401, undefined, undefined, true)
        }
        const userId: string = user.id;
        if (!validateMongooseId({ userId, courseId })) {
            logger.info("Invalid IDs", { userId, courseId });
            return failResponse({ message: "Invalid IDs" }, 400, undefined, undefined, true);
        }
        await progressQueue.add("generate-progress", { userId, courseId });
        logger.info("Progress of the Lesson created in worker");
        return successResponse({ message: "Progress updated" }, 202, undefined, undefined, true);
    } catch (error: unknown) {

        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Progress Generation Failed", { message });
        return failResponse({ message: `Failed to complete lesson :${message}` }, 500, undefined, undefined, true);
    }
}
export async function PUT(request: CustomNextRequest, context: { params: { courseId: string, lessonId: string } }): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, PROGRESS_LESSON_IP_KEY.namespace, PROGRESS_LESSON_IP_KEY.max, PROGRESS_LESSON_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    // await connectDB(process.env.MONGODB_URI!);

    try {
        const { courseId, lessonId } = context.params;
        const body = await parseBody(request, updateProgressBodySchema);
        if (!body.ok) return body.response;
        const { progressValue } = body.data;
        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = authSession?.user;
        if (!user) {
            logger.info("unauthorised access", { ip: ip });
            return failResponse({ message: "Unauthorized" }, 401, undefined, undefined, true)
        }
        const userId: string = user.id;
        if (!validateMongooseId({ userId, courseId, lessonId })) {
            logger.info("Invalid IDs", { userId, courseId, lessonId });
            return failResponse({ message: "Invalid IDs" }, 400, undefined, undefined, true);
        }
        if (typeof progressValue !== "number" || progressValue < 0 || progressValue > 100) {
            logger.info("Invalid progress value", { progressValue });
            return failResponse({ message: "Invalid progress value" }, 400, undefined, undefined, true);
        }
        //Integrate worker queue of other repo here 
        await progressQueue.add("update-progress", { userId, courseId, lessonId, progressValue });
        logger.info("Progress of the Lesson updated in worker");
        return successResponse({ message: "Progress updated" }, 202, undefined, undefined, true);
    } catch (error: unknown) {
        logger.error("Error updating progress:", { error });
        const message = error instanceof Error ? error.message : 'Unknown error';
        return failResponse({ message: `Failed to complete lesson :${message}` }, 500, undefined, undefined, true);
    }
}
