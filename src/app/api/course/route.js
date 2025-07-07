import { NextResponse } from "next/server";
import Course from "@/models/courseModel";
import { connectDB } from "@/config/db";

export async function GET(request) {
    await connectDB();
    try {
        // console.log("Fetching courses,controller called");
        // console.log("Fetching courses called");
        const courses = await Course.find().populate("instructor", "name email");
        return NextResponse.json(courses);
    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Something went wrong on the server side" }, { status: 500 });
    }
}
