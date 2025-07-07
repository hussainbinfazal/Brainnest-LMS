import { NextResponse } from "next/server";
import Course from "@/models/courseModel";
import User from "@/models/userModel";
import { connectDB } from "@/config/db";

export async function GET(request, context) {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 5;



    const skip = (page - 1) * limit;

    try {
        const totalCourses = await Course.countDocuments();
        const courses = await Course.find().skip(skip).limit(limit);

        if (!courses || courses.length === 0) {
            return NextResponse.json({ message: "No Courses Found" }, { status: 404 });
        }

        return NextResponse.json({
            data: courses,
            currentPage: page,
            totalPages: Math.ceil(totalCourses / limit),
            totalCourses
        });
    } catch (error) {
        console.error("Error fetching courses:", error);
        return NextResponse.json({ message: "Something went wrong on the server side" }, { status: 500 });
    }
}