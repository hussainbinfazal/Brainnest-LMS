import { NextResponse } from "next/server";
import Course from "@/models/courseModel";
import { connectDB } from "@/config/db";
import { getDataFromToken } from "@/utils/getDataFromToken";
import Progress from "@/models/progressModel";


export async function GET(request, { params }) {
    await connectDB();
    try {
        const user = await getDataFromToken(request);
        if (user.role !== "instructor") { return NextResponse.json({ message: "You are not authorized" }, { status: 401 }); }
        const { courseId } = await params;
        // console.log("This is the courseId", courseId);
        if (!courseId) {
            return NextResponse.json({ message: "Course id is required" }, { status: 400 });
        }
        const course = await Course.findById(courseId).lean();;
        if (!course) {
            return NextResponse.json({ message: "Course not found" }, { status: 404 });
        }
        let progress = [];
        if (user.role === "student") {
            const userProgress = await Progress.findOne({
                userId: user._id,
                courseId,
            });
            progress = userProgress?.completedLessons || [];
        }
        return NextResponse.json({
            course,
            progress,
        });
    } catch (error) {
        return NextResponse.json({ message: "Something went wrong on the server side" }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    await connectDB();
    try {
        const { courseId } = params;
        const user = await getDataFromToken(request);
        if (user.role !== "instructor") { return NextResponse.json({ message: "You are not authorized" }, { status: 401 }); }
        if (!courseId) {
            return NextResponse.json({ message: "Course id is required" }, { status: 400 });
        }
        const course = await Course.findByIdAndDelete(courseId);
        if (!course) {
            return NextResponse.json({ message: "Course not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Course deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}


export async function PUT(request,context) {
    await connectDB();
    try {
        const { courseId } = await context.params;
        const body = await request.json();
        const {whatYouWillLearn} = body;
        // console.log("This is the whatWillYouLearn", whatYouWillLearn);
        const user = await getDataFromToken(request);
        if (user.role !== "instructor") { return NextResponse.json({ message: "You are not authorized" }, { status: 401 }); }
        if (!courseId) {
            return NextResponse.json({ message: "Course id is required" }, { status: 400 });
        }
        const course = await Course.findById(courseId);
        if (!course) {
            return NextResponse.json({ message: "Course not found" }, { status: 404 });
        }
        const updatedCourse = await Course.findByIdAndUpdate(courseId, body, { new: true });
        return NextResponse.json({ message: "Course updated successfully", course:updatedCourse }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}