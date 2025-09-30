import { NextResponse } from "next/server";
import Course from "@/models/course/courseModel";
import User from "@/models/userModel";
import { connectDB } from "@/config/db";

export async function GET(request) {
    await connectDB();
    try {
        // console.log("Fetching courses,controller called");
        // console.log("Fetching courses called");
        const courses = await Course.find().populate("instructor", "name email");
        return NextResponse.json(courses);
    } catch (error) {
        console.error("Error in /api/course:", error);
        return NextResponse.json({ message: "Something went wrong on the server side, please try again" }, { status: 500 });
    }
}
