import { connectDB, Progress, Course, User, Lesson, logger, IUser, ILessonProgress } from "@repo/shared";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { NextResponse } from "next/server";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { certificateQueue } from "@/lib/queue/certificateQueue";
import { validateMongooseId } from "@/utils/fieldsValidation/idValidator/idValidator";
import { userCourse as UserCourse } from "@repo/shared";
import { LessonProgress } from "@repo/shared";
import { CACHE_TTL, invalidateCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import { serializeDocument } from "@/utils/serializer/serializeDocument";
export async function POST(request: CustomNextRequest, context: { params: { courseId: string, sectionId: string, lessonId: string } }) {
    await connectDB(process.env.MONGODB_URI);

    try {
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
        if (!user) {
            logger.info("Unauthorized access", { ip: request.ip });
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }
        const userId: string = user?.id;
        if (!courseId || !lessonId) {
            return NextResponse.json({ message: "Course and lesson IDs are required" }, { status: 400 });
        }
        if (!validateMongooseId({ userId, courseId, lessonId })) {
            logger.info("Invalid IDs", { userId, courseId, lessonId });
            return NextResponse.json({ message: "Invalid IDs" }, { status: 400 });
        };
        //Invalidate Cached Progress for the course 
        await invalidateCached(`progress:course`, `${userId}:${courseId}`);


        //Find the course, lesson and user in the database
        let [lessonDB, courseDB, userDB] = await Promise.all([
            Lesson.findOne({ _id: lessonId, courseId: courseId }).lean(),
            Course.findById(courseId)
                .select("instructorId title totalLessons")
                .populate("instructorId", "name")
                .lean(),
            User.findById(userId)
                .select("name")
                .lean(),


        ])
        if (!lessonDB) {
            logger.info("Lesson not found", { lessonId });
            return NextResponse.json({ message: "Lesson not found" }, { status: 404 });
        }
        if (!userDB) {
            logger.info("User not found", { userId });
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        if (!courseDB) {
            logger.info("Course not found", { courseId });
            return NextResponse.json({ message: "Course not found" }, { status: 404 });
        }
        // await progressDB!.save();

        // // Optional: check if user completed course
        const sectionId = lessonDB.sectionId;

        // idempotent insert — this is the source of truth for "did this lesson get completed"
        const completionResult = await LessonProgress.findOneAndUpdate(
            { userId, lessonId, courseId, sectionId },
            { $setOnInsert: { userId, courseId, sectionId, lessonId, completedAt: new Date(), lastPositionSeconds: 0, status: "completed" } },
            { upsert: true, new: true, includeResultMetadata: true }
        );

        const isNewCompletion = Boolean(completionResult.lastErrorObject?.upserted)
        const lessonProgressDoc = completionResult.value; //Actual Updated lesson
        const completedLessonIds: string[] = (await LessonProgress.distinct("lessonId", { userId, courseId, status: "completed" })).map((l) => l.lessonId.toString());
        if (!isNewCompletion) {
            // already completed earlier — no-op, don't double count
            const progressDB = await Progress.findOne({ userId, courseId }).lean();
            return NextResponse.json({ message: "Lesson already marked as completed", progress: progressDB, lessonProgress: lessonProgressDoc, completedLessonIds }, { status: 200 });
        }

        // only increments on a genuinely new completion
        const progressDB = await Progress.findOneAndUpdate(
            { userId, courseId, },
            {
                $inc: { "sectionProgress.completedCount": 1, completedLessonsCount: 1 },
                $set: { lastAccessedAt: new Date() },
            },
            { upsert: true, new: true }
        );

        const percentageCompleted = courseDB.totalLessons === 0
            ? 0
            : Math.round((progressDB.completedLessonsCount / courseDB.totalLessons) * 100);

        progressDB.percentageCompleted = percentageCompleted;
        await progressDB.save();

        if (percentageCompleted === 100) {
            logger.info("User completed course", { userName: userDB.name, courseName: courseDB.title });
            await UserCourse.findOneAndUpdate(
                { userId, courseId },
                { isCompleted: true, completedAt: new Date() },
                { upsert: true }
            );
            //Assign a job to the queue to generate the certificate for the user after completing the course
            await certificateQueue.add("generate-certificate", {
                userId,
                userName: userDB.name,
                courseId,
                instructorName: (courseDB.instructorId as IUser)?.name,
                courseTitle: courseDB.title,
            });
        };
        const allLessonProgress: ILessonProgress[] =
            await LessonProgress.find({ userId, courseId }).lean();

        let cachedFormat = {
            progress: progressDB,
            completedLessons: allLessonProgress,
            completedLessonIds
        }
        const serializedCachedFormat = await serializeDocument(cachedFormat);
        await setCached(`progress:course`, `${userId}:${courseId}`, serializedCachedFormat, CACHE_TTL.MEDIUM);
        let response = {
            courseProgress: progressDB,
            lessonProgress: lessonProgressDoc, //Updated Course
            completedLessonIds,
        };
        return NextResponse.json({ message: "Lesson marked as completed", ...response });
    } catch (error: unknown) {
        console.error("Error marking lesson complete:", error); // Log the error for debugging in dev environment 
        const message: string = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error marking lesson complete:", { message });
        return NextResponse.json({ message: `Failed to complete lesson :${message}` }, { status: 500 });
    }
}