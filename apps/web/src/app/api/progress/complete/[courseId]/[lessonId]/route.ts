import { connectDB } from "@/config/mongoDB/db";
import Progress from "@/models/Course/progressModel";
import Course from "@/models/Course/courseModel";
import User from "@/models/User/userModel"
import UserCourse from "@/models/User/userCourse";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { NextRequest, NextResponse } from "next/server";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { ILesson, IProgress, IUser } from "@/types/model";
import mongoose from "mongoose";
import Lesson from "@/models/Course/lessonModel";
import { logger } from "@/utils/logger/logger.node";
import { certificateQueue } from "@/lib/queue/certificateQueue";
import { validateMongooseId } from "@/utils/fieldsValidation/idValidator/idValidator";
export async function POST(request: CustomNextRequest, context: { params: { courseId: string, lessonId: string } }) {
    await connectDB();

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

        // const userInDB: IUser | null = await User.findById(userId)
        // if (!userInDB) { return NextResponse.json({ message: "User not found" }, { status: 404 }); }

        await Progress.updateOne(
            { userId, courseId },
            {
                $addToSet: { completedLessons: lessonId },
                $inc: { completedLessonsCount: 1 }
            },
            { upsert: true }
        )
        let [lessonDB, progressDB, courseDB, userDB] = await Promise.all([
            Lesson.findOne({ _id: lessonId, courseId: courseId }).lean(),
            Progress.findOne({ userId, courseId }),
            Course.findById(courseId)
                .select("instructorId title")
                .populate("instructorId", "name")
                .lean(),
            User.findById(userId)
                .select("name")
                .lean()
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

        if (!validateMongooseId({ userId, courseId, lessonId })) {
            logger.info("Invalid IDs", { userId, courseId, lessonId });
            return NextResponse.json({ message: "Invalid IDs" }, { status: 400 });
        }


        const lessonObjectId = new mongoose.Types.ObjectId(lessonId);
        if (!progressDB) {
            progressDB = new Progress({
                userId,
                courseId,
                completedLessons: [lessonObjectId],
            });
        } else {
            progressDB.completedLessons.some(
                id => id.toString() === lessonId
            )
        }
        const totalLessons: number = courseDB.totalLessons
        const completedLessonCount: number = progressDB!.completedLessons.length || 0;

        const totalPercentageCompleted = totalLessons === 0 ? 0 : Math.round((completedLessonCount / totalLessons) * 100);

        progressDB!.percentageCompleted = totalPercentageCompleted

        if (totalPercentageCompleted === 100) {
            logger.info("This user completed this course", { userName: userDB?.name, courseName: courseDB?.title });
            await UserCourse.findOneAndUpdate(
                { userId: userId, courseId: courseId }, { isCompleted: true, completedAt: new Date() },
                { upsert: true }
            );
            await certificateQueue.add("generate-certificate", {
                userId: userId,
                userName: userDB.name,
                courseId: courseId,
                instructorName: (courseDB.instructorId as IUser)?.name,
                courseTitle: courseDB.title
            })
        }

        await progressDB!.save();
        // Optional: check if user completed course

        return NextResponse.json({ message: "Lesson marked as completed", progressDB });
    } catch (error: any) {
        console.error("Error marking lesson complete:", error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `Failed to complete lesson :${message}` }, { status: 500 });
    }
}