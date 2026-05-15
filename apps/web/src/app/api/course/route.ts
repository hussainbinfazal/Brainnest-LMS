import { NextRequest, NextResponse } from "next/server";
import Course from "@/models/Course/courseModel";
import { connectDB } from "@/config/mongoDB/db";
import { logger } from "@/utils/logger/logger.node";
import { ICourse } from "@/types/model";

export async function GET(request: NextRequest): Promise<NextResponse> {
    await connectDB();
    try {
        const courses: ICourse[] | null = await Course.find().populate("instructorId", "name email");
        return NextResponse.json({ message: "Courses fetched successfully", courses: courses }, { status: 200 });
    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error fetching courses:", { error: message });
        return NextResponse.json({ message: `Error in Fetching Courses : ${message}` }, { status: 500 });
    }
}
