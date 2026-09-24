import { getClientIp } from "@repo/shared/utils/getClientIp";


import { NextResponse } from "next/server";
import { connectDB, INSTRUCTOR_COURSES_ALL, InstructorCoursesResponse } from "@repo/shared";
import { Course, ICourse, validateMongooseId } from "@repo/shared";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { logger } from "@/utils/logger/logger.node";
import { getCached, invalidateCached } from "@repo/shared/config/redisConfig/cache-helper";
import { getInstructorCoursesWithCache } from "@/lib/adminCached/getAdminCachedCourse";
import { Session } from "next-auth";
import { auth } from "@/auth";




export async function GET(request: CustomNextRequest, context: { params: { InstructorId: string } }): Promise<NextResponse> {
    const ip = getClientIp(request.headers);
    if (ip === 'unknown') logger.warn('OTP route: could not resolve client IP');
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams?.get('page') || '1') || 1;
    const limit = parseInt(searchParams?.get('limit') || '5') || 5;
    const skip = Number((page - 1)) * limit;
    try {
        const authSession: Session | null = await auth()
        if (!authSession) return NextResponse.json({ message: "Unauthorized", ip: ip }, { status: 401 });
        const user: ISessionUser | null = authSession?.user; //For Cache Keys        

        if (!user) {
            logger.info("Unauthorized access", { ip: ip });
            return NextResponse.json({
                message: "Unauthorized", data: {
                    paginatedInstructorCourses: [],
                    hasNextPage: false,
                    hasPrevPage: false,
                    currentPage: page,
                    totalPages: 1,
                    totalInstructorCourses: 0
                }
            }, { status: 401 })
        };
        const { InstructorId } = await context.params;
        const userId: string = user.id;

        if (!userId || !validateMongooseId({ userId })) {
            logger.info("Invalid user id", { userId });
            return NextResponse.json({
                message: "Invalid user id", data: {
                    paginatedInstructorCourses: [],
                    hasNextPage: false,
                    hasPrevPage: false,
                    currentPage: page,
                    totalPages: 1,
                    totalInstructorCourses: 0
                }
            }, { status: 400 })
        }
        if (!InstructorId || !validateMongooseId({ userId: InstructorId })) {
            logger.info("Invalid instructor id", { InstructorId, userId, ip: ip });
            return NextResponse.json({
                message: "Invalid instructor id", data: {
                    paginatedInstructorCourses: [],
                    hasNextPage: false,
                    hasPrevPage: false,
                    currentPage: page,
                    totalPages: 1,
                    totalInstructorCourses: 0
                }
            }, { status: 400 })
        }
        if (user.role !== "instructor") {
            logger.info("Unauthorized access", { user, ip: ip });
            return NextResponse.json({
                message: "Unauthorized", data: {
                    paginatedInstructorCourses: [],
                    hasNextPage: false,
                    hasPrevPage: false,
                    currentPage: page,
                    totalPages: 1,
                    totalInstructorCourses: 0
                }
            }, { status: 401 })
        }
        const cacheId = `${page}-${limit}-${skip}-${InstructorId}`;
        const cachedInstructorCourses = await getCached<InstructorCoursesResponse>(INSTRUCTOR_COURSES_ALL.namespace, cacheId);
        if (cachedInstructorCourses) {
            logger.info("Instructor Courses fetched from cache", {
                courseCount: cachedInstructorCourses.paginatedInstructorCourses.length,
            });
            return NextResponse.json({
                message: "Instructor Courses fetched successfully",
                data: cachedInstructorCourses
            }, { status: 200 })

        }
        const instructorCourses = await getInstructorCoursesWithCache(InstructorId, page, limit, skip);
        logger.info("Instructor Courses fetched from database", {
            courseCount: instructorCourses.paginatedInstructorCourses.length,
        });
        return NextResponse.json({ message: "Instructor Courses fetched successfully", data: instructorCourses }, { status: 200 })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in getting all courses for instructor", { error: message });
        return NextResponse.json({ message: `Error in getting all courses`, data: { paginatedInstructorCourses: [], hasNextPage: false, hasPrevPage: false, currentPage: page, totalPages: 1, totalInstructorCourses: 0 } }, { status: 500 })
    }
}



export async function DELETE(request: CustomNextRequest, context: { params: { InstructorId: string } }) {
    const ip = getClientIp(request.headers);
    if (ip === 'unknown') logger.warn('OTP route: could not resolve client IP');
    const { searchParams } = new URL(request.url);
    const page: number = parseInt(searchParams?.get('page') || '1') || 1;
    const limit: number = parseInt(searchParams?.get('limit') || '5') || 5;
    const courseId: string = searchParams?.get('courseId') || '';
    const skip: number = Number((page - 1)) * limit;
    try {
        const authSession: Session | null = await auth()
        if (!authSession) return NextResponse.json({ message: "Unauthorized", ip: ip }, { status: 401 });
        const user: ISessionUser | null = authSession?.user;
        if (!user || user.role !== "instructor" || !user.id) {
            logger.warn("Unauthorized access", { user, ip: ip });
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        };
        const cacheId = `${page}-${limit}-${skip}-${user.id}`;//Dynamic Conditional Cache Key


        await connectDB(process.env.MONGODB_URI!);
        const { InstructorId } = await context.params;
        if (!validateMongooseId({ userId: InstructorId })) {
            logger.error("Invalid instructor id", { InstructorId });
            return NextResponse.json({ message: "Invalid instructor id" }, { status: 400 })
        };
        if (!validateMongooseId({ courseId: courseId })) {
            logger.error("Invalid course id", { courseId });
            return NextResponse.json({ message: "Invalid course id" }, { status: 400 })
        };
        //Se
        const sessionInstructorId: string = user.id;
        if (!validateMongooseId({ userId: sessionInstructorId })) {
            logger.error("Invalid user id", { userId: sessionInstructorId });
            return NextResponse.json({ message: "Invalid user" }, { status: 400 })
        }
        if (InstructorId !== sessionInstructorId.toString()) {
            logger.warn("Unauthorized access", { user, ip: ip });
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        };
        //Soft Delete the course not delete the course
        const result = await Course.updateOne(
            { _id: courseId, instructorId: InstructorId, isDeleted: false },
            { isDeleted: true, deletedAt: new Date() }
        );
        if (result.matchedCount === 0) {
            logger.warn("Course not found or not owned by instructor", { courseId, InstructorId });
            return NextResponse.json({ message: "Course not found" }, { status: 404 });
        }
        await invalidateCached(INSTRUCTOR_COURSES_ALL.namespace, cacheId);
        logger.info("Course deleted successfully", { courseId });
        return NextResponse.json({ message: "Course deleted successfully" }, { status: 200 })
    } catch (error: unknown) {
        const message: string = error instanceof Error ? error.message : "Something went wrong";
        logger.error("Something went wrong while deleting course", { error, message });
        return NextResponse.json({ message: "Error in deleting course" }, { status: 500 })
    }
}