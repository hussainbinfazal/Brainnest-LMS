import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";


import { NextResponse } from "next/server";
import { connectDB, INSTRUCTOR_COURSES_ALL, InstructorCoursesResponse } from '@repo/shared/server';
import { Course, ICourse, validateMongooseId } from '@repo/shared/server';
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { logger } from "@repo/shared/server";
import { getCached, invalidateCached } from "@repo/shared/config/redisConfig/cache-helper";
import { getInstructorCoursesWithCache } from "@/lib/adminCached/getAdminCachedCourse";
import { Session } from "next-auth";
import { auth } from "@/auth";
import { ADMIN_INSTRUCTOR_COURSES_IP_KEY, checkIp } from "@repo/shared/server";




export async function GET(request: CustomNextRequest, context: { params: { InstructorId: string } }): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, ADMIN_INSTRUCTOR_COURSES_IP_KEY.namespace, ADMIN_INSTRUCTOR_COURSES_IP_KEY.max, ADMIN_INSTRUCTOR_COURSES_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams?.get('page') || '1') || 1;
    const limit = parseInt(searchParams?.get('limit') || '5') || 5;
    const skip = Number((page - 1)) * limit;
    try {
        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = authSession?.user; //For Cache Keys        

        if (!user) {
            logger.info("Unauthorized access", { ip: ip });
            return failResponse({
                message: "Unauthorized", data: {
                    paginatedInstructorCourses: [],
                    hasNextPage: false,
                    hasPrevPage: false,
                    currentPage: page,
                    totalPages: 1,
                    totalInstructorCourses: 0
                }
            }, 401, undefined, undefined, true)
        };
        const { InstructorId } = await context.params;
        const userId: string = user.id;

        if (!userId || !validateMongooseId({ userId })) {
            logger.info("Invalid user id", { userId });
            return failResponse({
                message: "Invalid user id", data: {
                    paginatedInstructorCourses: [],
                    hasNextPage: false,
                    hasPrevPage: false,
                    currentPage: page,
                    totalPages: 1,
                    totalInstructorCourses: 0
                }
            }, 400, undefined, undefined, true)
        }
        if (!InstructorId || !validateMongooseId({ userId: InstructorId })) {
            logger.info("Invalid instructor id", { InstructorId, userId, ip: ip });
            return failResponse({
                message: "Invalid instructor id", data: {
                    paginatedInstructorCourses: [],
                    hasNextPage: false,
                    hasPrevPage: false,
                    currentPage: page,
                    totalPages: 1,
                    totalInstructorCourses: 0
                }
            }, 400, undefined, undefined, true)
        }
        if (user.role !== "instructor") {
            logger.info("Unauthorized access", { user, ip: ip });
            return failResponse({
                message: "Unauthorized", data: {
                    paginatedInstructorCourses: [],
                    hasNextPage: false,
                    hasPrevPage: false,
                    currentPage: page,
                    totalPages: 1,
                    totalInstructorCourses: 0
                }
            }, 401, undefined, undefined, true)
        }
        const cacheId = `${page}-${limit}-${skip}-${InstructorId}`;
        const cachedInstructorCourses = await getCached<InstructorCoursesResponse>(INSTRUCTOR_COURSES_ALL.namespace, cacheId);
        if (cachedInstructorCourses) {
            logger.info("Instructor Courses fetched from cache", {
                courseCount: cachedInstructorCourses.paginatedInstructorCourses.length,
            });
            return successResponse({
                message: "Instructor Courses fetched successfully",
                data: cachedInstructorCourses
            }, 200, undefined, undefined, true)

        }
        const instructorCourses = await getInstructorCoursesWithCache(InstructorId, page, limit, skip);
        logger.info("Instructor Courses fetched from database", {
            courseCount: instructorCourses.paginatedInstructorCourses.length,
        });
        return successResponse({ message: "Instructor Courses fetched successfully", data: instructorCourses }, 200, undefined, undefined, true)
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in getting all courses for instructor", { error: message });
        return failResponse({ message: `Error in getting all courses`, data: { paginatedInstructorCourses: [], hasNextPage: false, hasPrevPage: false, currentPage: page, totalPages: 1, totalInstructorCourses: 0 } }, 500, undefined, undefined, true)
    }
}



export async function DELETE(request: CustomNextRequest, context: { params: { InstructorId: string } }) {
    const { allowed, retryAfterSec, ip } = await checkIp(request, ADMIN_INSTRUCTOR_COURSES_IP_KEY.namespace, ADMIN_INSTRUCTOR_COURSES_IP_KEY.max, ADMIN_INSTRUCTOR_COURSES_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    const { searchParams } = new URL(request.url);
    const page: number = parseInt(searchParams?.get('page') || '1') || 1;
    const limit: number = parseInt(searchParams?.get('limit') || '5') || 5;
    const courseId: string = searchParams?.get('courseId') || '';
    const skip: number = Number((page - 1)) * limit;
    try {
        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = authSession?.user;
        if (!user || user.role !== "instructor" || !user.id) {
            logger.warn("Unauthorized access", { user, ip: ip });
            return failResponse({ message: "Unauthorized" }, 401, undefined, undefined, true)
        };
        const cacheId = `${page}-${limit}-${skip}-${user.id}`;//Dynamic Conditional Cache Key


        await connectDB(process.env.MONGODB_URI!);
        const { InstructorId } = await context.params;
        if (!validateMongooseId({ userId: InstructorId })) {
            logger.error("Invalid instructor id", { InstructorId });
            return failResponse({ message: "Invalid instructor id" }, 400, undefined, undefined, true)
        };
        if (!validateMongooseId({ courseId: courseId })) {
            logger.error("Invalid course id", { courseId });
            return failResponse({ message: "Invalid course id" }, 400, undefined, undefined, true)
        };
        //Se
        const sessionInstructorId: string = user.id;
        if (!validateMongooseId({ userId: sessionInstructorId })) {
            logger.error("Invalid user id", { userId: sessionInstructorId });
            return failResponse({ message: "Invalid user" }, 400, undefined, undefined, true)
        }
        if (InstructorId !== sessionInstructorId.toString()) {
            logger.warn("Unauthorized access", { user, ip: ip });
            return failResponse({ message: "Unauthorized" }, 401, undefined, undefined, true)
        };
        //Soft Delete the course not delete the course
        const result = await Course.updateOne(
            { _id: courseId, instructorId: InstructorId, isDeleted: false },
            { isDeleted: true, deletedAt: new Date() }
        );
        if (result.matchedCount === 0) {
            logger.warn("Course not found or not owned by instructor", { courseId, InstructorId });
            return failResponse({ message: "Course not found" }, 404, undefined, undefined, true);
        }
        await invalidateCached(INSTRUCTOR_COURSES_ALL.namespace, cacheId);
        logger.info("Course deleted successfully", { courseId });
        return successResponse({ message: "Course deleted successfully" }, 200, undefined, undefined, true)
    } catch (error: unknown) {
        const message: string = error instanceof Error ? error.message : "Something went wrong";
        logger.error("Something went wrong while deleting course", { error, message });
        return failResponse({ message: "Error in deleting course" }, 500, undefined, undefined, true)
    }
}