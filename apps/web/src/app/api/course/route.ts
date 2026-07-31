import { NextRequest, NextResponse } from "next/server";
import { Course, connectDB, logger, ICourse } from "@repo/shared";
import { CustomNextRequest } from "@/types/server";
import mongoose from "mongoose";
import { CCourse } from "@/types/client";
import { serializeCourses } from "@/utils/serializer/course.Serializer";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import { getCoursesWithCache } from "@/lib/getCachedCourse";



export async function GET(request: CustomNextRequest): Promise<NextResponse> {
    await connectDB(process.env.MONGODB_URI!);
    console.log("app-level readyState:", mongoose.connection.readyState);
    console.log("Course.db readyState:", Course.db?.readyState);
    console.log("same mongoose instance?", mongoose === (Course as any).base);
    console.log("request passed in api/course")
    try {
        const cachedCourses = await getCoursesWithCache();
        logger.info("Courses fetched successfully", { courseCount: cachedCourses?.length || 0 });
        return NextResponse.json({ message: "Courses fetched successfully", courses: cachedCourses }, { status: 200 });
    } catch (error: unknown) {
        console.log("This is the error on server side", error)
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error fetching courses:", { error: message });
        return NextResponse.json({ message: `Error in Fetching Courses : ${message}` }, { status: 500 });
    }
}
