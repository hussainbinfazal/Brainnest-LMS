

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@repo/shared";
import { Course, ICourse, validateMongooseId } from "@repo/shared";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { ISessionUser } from "@/types/server";
import { logger } from "@/utils/logger/logger.node";

export async function GET(request: NextRequest): Promise<NextResponse> {
    await connectDB(process.env.MONGODB_URI!);
    try {
        const userFromSession: ISessionUser | null = await getDataFromToken(request);
        if (!userFromSession || !validateMongooseId({ userId: userFromSession.id })) {
            logger.warn("Unauthorized access attempt in admin all course route");
            return NextResponse.json({ message: "You are not authorized to acces this route" }, { status: 401 })
        }
        if (userFromSession.role !== "instructor") return NextResponse.json({ message: "You are not authorized to access this route" }, { status: 401 });
        logger.info("User in the admin all course route", { userId: userFromSession?.id });
        const userIdOfInstructor: string = userFromSession.id;
        const courses: ICourse[] = await Course.find({ instructor: userIdOfInstructor }).populate("instructorId", "name email").lean();
        logger.info("Successfully retrieved courses for instructor", { instructorId: userIdOfInstructor, courseCount: courses.length });
        return NextResponse.json({ courses }, { status: 200 })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in getting all courses for instructor", { error: message });
        return NextResponse.json({ message: `Error in getting all courses` }, { status: 500 })
    }
}