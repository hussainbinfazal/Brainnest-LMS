import { connectDB } from "@/config/db";
import Progress from "@/models/progressModel";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { NextResponse } from "next/server";

export async function GET(request,context) {
    await connectDB();

    try {
        const { courseId, lessonId } = await context.params;
        // console.log("This is the course ID", courseId);
        // console.log("This is the lesson ID", lessonId);
        const user = await getDataFromToken(request);
        const userId = user._id || user.id;
        if (!courseId || !lessonId) {
            return NextResponse.json({ message: "Course and lesson IDs are required" }, { status: 400 });
        }

        let progress = await Progress.findOne({ userId, courseId }).populate("completedLessons");
        if(!progress){return NextResponse.json({ message: "Progress not found" }, { status: 400 });}

        return NextResponse.json({ message: "Lesson marked as completed", progress });
    } catch (error) {
        console.error("Error marking lesson complete:", error);
        return NextResponse.json({ message: "Failed to complete lesson" }, { status: 500 });
    }
}