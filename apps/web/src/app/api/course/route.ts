import { NextRequest, NextResponse } from "next/server";
import {Course, connectDB, logger} from "@repo/shared";
import { ICourse } from "@/types/model";

export async function GET(request: NextRequest): Promise<NextResponse> {
    await connectDB(process.env.MONGODB_URI!);
    try {
        const courses: ICourse[] | null = await Course.find().populate("instructorId", "name email");
        logger.info("Courses fetched successfully", { courseCount: courses?.length || 0 });
        return NextResponse.json({ message: "Courses fetched successfully", courses: courses }, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error fetching courses:", { error: message });
        return NextResponse.json({ message: `Error in Fetching Courses : ${message}` }, { status: 500 });
    }
}
