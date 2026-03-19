

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/mongoDB/db";
import Course from "@/models/Course/courseModel";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { ICourse } from "@/types/model";
import { ISessionUser } from "@/types/server";
import { logger } from "@/utils/logger/logger";

export async function GET(request: NextRequest): Promise<NextResponse> {
    await connectDB();
    try {
        const userFromSession: ISessionUser | null = await getDataFromToken(request);
        if (!userFromSession) {
            logger.warn("Unauthorized access attempt in admin all course route");
            return NextResponse.json({ message: "You are not authorized to acces this route" }, { status: 401 })
        }
        if(userFromSession.role !== "instructor") return NextResponse.json({ message: "You are not authorized to access this route" }, { status: 401 });
        logger.info("User in the admin all course route", { userId: userFromSession?.id });
        const userIdOfInstructor: string = userFromSession.id;
        const courses: ICourse[] = await Course.find({ instructor: userIdOfInstructor }).populate("instructorId", "name email").lean();
        logger.info("Successfully retrieved courses for instructor", { instructorId: userIdOfInstructor, courseCount: courses.length });
        return NextResponse.json({ courses }, { status: 200 })
    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in getting all courses for instructor", { error: message });
        return NextResponse.json({ message: `Error in getting all courses: ${message}` }, { status: 500 })
    }
}