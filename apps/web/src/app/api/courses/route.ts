import { NextRequest, NextResponse } from "next/server";
import {Course, User, connectDB, logger} from "@repo/shared";
import { ICourse } from "@/types/model";
import { CustomNextRequest } from "@/types/server";

export async function GET(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    await connectDB(process.env.MONGODB_URI!);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams?.get('page') || '1') || 1;
    const limit = parseInt(searchParams?.get('limit') || '5') || 5;
    const skip = Number((page - 1)) * limit;

    try {
        const [totalCourseDoc, coursesInDB] = await Promise.all([
            Course.countDocuments(),
            Course.find().skip(skip).limit(limit)
        ]);
        const totalCourses: number = totalCourseDoc;
        const courses: ICourse[] = coursesInDB;

        if (!courses || courses.length === 0) {
            return NextResponse.json({ message: "No Courses Found" }, { status: 404 });
        }
        logger.info("Courses fetched successfully", { totalCourses, page, limit });
        return NextResponse.json({
            data: courses,
            currentPage: page,
            totalPages: Math.ceil(totalCourses / limit),
            totalCourses
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error fetching courses:", { error: message });
        return NextResponse.json({ message: ` Error fetching courses: ${message}` }, { status: 500 });
    }
}