import { NextRequest, NextResponse } from "next/server";
import { Course, User, connectDB, logger } from "@repo/shared";
import { ICourse } from "@repo/shared";
import { CustomNextRequest, IGetCourseByParamsResponse } from "@/types/server";
import { CCourse } from "@/types/client";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import { serializeCourses } from "@/utils/serializer/course.Serializer";



export async function GET(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams?.get('page') || '1') || 1;
    const limit = parseInt(searchParams?.get('limit') || '5') || 5;
    const skip = Number((page - 1)) * limit;
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || !Number.isInteger(skip) || skip < 0) {
        logger.warn("Invalid parameters for fetching courses", { page, limit, skip });
        throw new Error("Invalid parameters for fetching courses");
    };
    const cached = await getCached<IGetCourseByParamsResponse>(`coursesByParams`, `${page}-${limit}-${skip}`);
    if (cached) {
        logger.info("Courses fetched from cache", { page, limit, skip, courseCount: cached.paginatedCourses.length });
        return NextResponse.json(
            {
                message: "Courses Fetched Successfully",
                data: cached.paginatedCourses,
                currentPage: cached.currentPage,
                hasNextPage: cached.hasNextPage,
                hasPrevPage: cached.hasPrevPage,
                totalPages: cached.totalPage,
                totalCourses: cached.totalCourses
            },
            { status: 200 }
        )
    };
    await connectDB(process.env.MONGODB_URI!);
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
        const totalPages: number = Math.ceil(totalCourses / limit);
        const hasNextPage: boolean = page < totalPages;
        const hasPrevPage: boolean = page > 1;

        const responseData: IGetCourseByParamsResponse = {
            paginatedCourses: serializeCourses(courses),
            currentPage: page,
            hasNextPage,
            hasPrevPage,
            totalPage: Math.ceil(totalCourses / limit),
            totalCourses: totalCourses
        };
        await setCached(`coursesByParams`, `${page}-${limit}-${skip}`, responseData,CACHE_TTL.MEDIUM);
        return NextResponse.json({
            message: "Courses Fetched Succesfully",
            data: serializeCourses(courses),
            currentPage: page,
            hasNextPage,
            hasPrevPage,
            totalPages: Math.ceil(totalCourses / limit),
            totalCourses

        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error fetching courses:", { error: message });
        return NextResponse.json({ message: ` Error fetching courses` }, { status: 500 });
    }
}