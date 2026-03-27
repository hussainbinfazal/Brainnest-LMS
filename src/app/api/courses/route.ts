import { NextRequest, NextResponse } from "next/server";
import Course from "@/models/Course/courseModel";
import User from "@/models/User/userModel";
import { connectDB } from "@/config/mongoDB/db";
import { ICourse } from "@/types/model";
import { CustomNextRequest } from "@/types/server";

export async function GET(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams?.get('page') || '1') || 1;
    const limit = parseInt(searchParams?.get('limit') || '5') || 5;
    const skip = Number((page - 1)) * limit;

    try {
        const totalCourses: number = await Course.countDocuments();
        const courses: ICourse[] = await Course.find().skip(skip).limit(limit);

        if (!courses || courses.length === 0) {
            return NextResponse.json({ message: "No Courses Found" }, { status: 404 });
        }

        return NextResponse.json({
            data: courses,
            currentPage: page,
            totalPages: Math.ceil(totalCourses / limit),
            totalCourses
        });
    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error fetching courses:", error);
        return NextResponse.json({ message: ` Error fetching courses: ${message}` }, { status: 500 });
    }
}