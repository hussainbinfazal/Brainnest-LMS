import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextRequest, NextResponse } from "next/server";
import { Course, connectDB, logger, ICourse } from '@repo/shared/server';
import { CustomNextRequest } from "@/types/server";
import mongoose from "mongoose";
import { getCoursesWithCache } from "@/lib/non-Admin-Cached/getCachedCourse";



export async function GET(request: CustomNextRequest): Promise<NextResponse> {
    await connectDB(process.env.MONGODB_URI!);
    console.log("app-level readyState:", mongoose.connection.readyState);
    console.log("Course.db readyState:", Course.db?.readyState);
    console.log("same mongoose instance?", mongoose === (Course as any).base);
    console.log("request passed in api/course")
    try {
        const cachedCourses = await getCoursesWithCache();
        logger.info("Courses fetched successfully", { courseCount: cachedCourses?.length || 0 });
        return successResponse({ message: "Courses fetched successfully", courses: cachedCourses }, 200, undefined, undefined, true);
    } catch (error: unknown) {
        console.log("This is the error on server side", error)
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error fetching courses:", { error: message });
        return failResponse({ message: `Error in Fetching Courses : ${message}` }, 500, undefined, undefined, true);
    }
}
