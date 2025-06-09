import { connectDB } from "@/config/db";
import Progress from "@/models/progressModel";
import Course from "@/models/courseModel";
import User from "@/models/userModel"
import { getDataFromToken } from "@/utils/getDataFromToken";
import { NextResponse } from "next/server";
export async function POST(request, context) {
    await connectDB();

    try {
        const { courseId, lessonId } = await context.params;
        const user = await getDataFromToken(request);
        const userId = user._id || user.id;
        if (!courseId || !lessonId) {
            return NextResponse.json({ message: "Course and lesson IDs are required" }, { status: 400 });
        }

        const userInDB  = await User.findById(userId)
        const course = await Course.findById(courseId);
        let lessonInCourse = course.lessons.find((lesson) => lesson._id == lessonId);
        lessonInCourse.status = "completed";
        let progress = await Progress.findOne({ userId, courseId });

        if (!progress) {
            progress = new Progress({
                userId,
                courseId,
                completedLessons: [lessonId],
            });
        } else {
            if (!progress.completedLessons.includes(lessonId)) {
                progress.completedLessons.push(lessonId);
            }
        }
        const totalLessons = course.lessons.length;
    const completedLessonCount = progress.completedLessons.length;

    if(totalLessons === completedLessonCount) {
        if(!progress.completedCourses.includes(courseId) && totalLessons > 0  ) {
        progress.completedCourses.push(courseId);
        if(!userInDB.completedCourses.includes(courseId)) {
            userInDB.completedCourses.push(courseId)
        }

    }
    }
    

    await userInDB.save();
        await progress.save();
        await course.save();
        return NextResponse.json({ message: "Lesson marked as completed", progress });
    } catch (error) {
        console.error("Error marking lesson complete:", error);
        return NextResponse.json({ message: "Failed to complete lesson" }, { status: 500 });
    }
}