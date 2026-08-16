import { connectDB, Progress, Course, User, Lesson, logger, userCourse, ILesson, IProgress, IUser, LessonCompletion } from "@repo/shared";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { NextRequest, NextResponse } from "next/server";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import mongoose from "mongoose";
import { certificateQueue } from "@/lib/queue/certificateQueue";
import { validateMongooseId } from "@/utils/fieldsValidation/idValidator/idValidator";
import UserCourse from "@repo/shared/models/User/userCourse";
export async function POST(request: CustomNextRequest, context: { params: { courseId: string, lessonId: string } }) {
    await connectDB(process.env.MONGODB_URI);

    try {
        const { courseId, lessonId } = context.params;
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
        }
        // const userInDB: IUser | null = await User.findById(userId)
        // if (!userInDB) { return NextResponse.json({ message: "User not found" }, { status: 404 }); }

        // await Progress.updateOne(
        //     { userId, courseId },
        //     {
        //         $addToSet: { completedLessons: lessonId },
        //         $inc: { completedLessonsCount: 1 }
        //     },
        //     { upsert: true }
        // )
        let [lessonDB, courseDB, userDB] = await Promise.all([
            Lesson.findOne({ _id: lessonId, courseId: courseId }).lean(),
            Course.findById(courseId)
                .select("instructorId title")
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
        const completionResult = await LessonCompletion.updateOne(
            { userId, lessonId },
            { $setOnInsert: { userId, courseId, sectionId, lessonId, completedAt: new Date() } },
            { upsert: true }
        );

        const isNewCompletion = completionResult.upsertedCount > 0;

        if (!isNewCompletion) {
            // already completed earlier — no-op, don't double count
            const progressDB = await Progress.findOne({ userId, courseId }).lean();
            return NextResponse.json({ message: "Lesson already marked as completed", progress: progressDB });
        }

        // only increments on a genuinely new completion
        const progressDB = await Progress.findOneAndUpdate(
            { userId, courseId },
            {
                $inc: { completedLessonsCount: 1 },
                $setOnInsert: { totalLessons: courseDB.totalLessons },
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
            await certificateQueue.add("generate-certificate", {
                userId,
                userName: userDB.name,
                courseId,
                instructorName: (courseDB.instructorId as IUser)?.name,
                courseTitle: courseDB.title,
            });
        }

        return NextResponse.json({ message: "Lesson marked as completed", progressDB });
    } catch (error: unknown) {
        console.error("Error marking lesson complete:", error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `Failed to complete lesson :${message}` }, { status: 500 });
    }
}