import { NextRequest, NextResponse } from "next/server";
import {Course, connectDB, logger, ICourse} from "@repo/shared";
import { CustomNextRequest } from "@/types/server";



export async function GET(request:CustomNextRequest ): Promise<NextResponse> {
    await connectDB(process.env.MONGODB_URI!);
    try {
        const courses: ICourse[] | null = await Course.find().populate("instructorId", "name email").limit(50).exec();
        logger.info("Courses fetched successfully", { courseCount: courses?.length || 0 });
        return NextResponse.json({ message: "Courses fetched successfully", courses: courses }, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error fetching courses:", { error: message });
        return NextResponse.json({ message: `Error in Fetching Courses : ${message}` }, { status: 500 });
    }
}
