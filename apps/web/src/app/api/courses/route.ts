import mongoose, { QueryFilter } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { COURSES_FILTERED_BY_PARAMS, Course, connectDB, logger } from "@repo/shared";
import { ICourse } from "@repo/shared";
import { CustomNextRequest, IGetCourseByParamsResponse } from "@/types/server";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import { serializeCourses } from "@/utils/serializer/course.Serializer";



export async function GET(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams?.get('page') || '1') || 1;
    const limit = parseInt(searchParams?.get('limit') || '5') || 5;
    const skip = Number((page - 1)) * limit;


    const category = searchParams?.get('category');
    const childCategories = searchParams?.getAll('childCategories');
    const languages = searchParams?.getAll('languages');
    const levels = searchParams?.getAll('levels');
    const categoryIds: string[] = [
        ...(category ? [category] : []), //single Id
        ...childCategories, //subcategories Id
    ];
    // [[categoryId?],[subCategoriesIds?]]
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || !Number.isInteger(skip) || skip < 0) {
        logger.warn("Invalid parameters for fetching courses", { page, limit, skip });
        throw new Error("Invalid parameters for fetching courses");
    };
    //Custom query to fetch course by on the basis of params.
    const query: QueryFilter<ICourse> = {};
    if (category) query["category._id"] = category;
    if (childCategories) query["subCategories._id"] = { $in: childCategories };
    if (languages.length) query.language = { $in: languages };
    if (levels.length) query.levels = { $in: levels };

    const cacheId = `${page}-${limit}-cat:${[...categoryIds].sort().join(",")}-lang:${[...languages].sort().join(",")}-level:${[...levels].sort().join(",")}`;//Dynamic Conditional Cache Key
    const cached = await getCached<IGetCourseByParamsResponse>(COURSES_FILTERED_BY_PARAMS.namespace, cacheId);
    if (cached) {
        logger.info("Courses fetched from cache", { page, limit, skip, courseCount: cached.paginatedCourses.length });
        return NextResponse.json(
            {
                message: "Courses Fetched Successfully",
                data: cached.paginatedCourses,
                currentPage: cached.currentPage,
                hasNextPage: cached.hasNextPage,
                hasPrevPage: cached.hasPrevPage,
                totalPages: cached.totalPages,
                totalCourses: cached.totalCourses
            },
            { status: 200 }
        )
    };
    await connectDB(process.env.MONGODB_URI!);
    try {
        const [totalCourseDoc, coursesInDB] = await Promise.all([
            Course.countDocuments(query),
            Course.find(query).skip(skip).limit(limit)
        ]);
        const totalCourses: number = totalCourseDoc;
        const courses: ICourse[] = coursesInDB;
        const totalPages: number = Math.ceil(totalCourses / limit);
        const hasNextPage: boolean = page < totalPages;
        const hasPrevPage: boolean = page > 1;
        if (!courses || courses.length === 0) {
            return NextResponse.json({ message: "No Courses Found" }, { status: 404 });
        }
        if (!courses || courses.length === 0) {
            logger.info("No courses matched filters ", {
                page, limit, category, childCategories, languages, levels
            });
            return NextResponse.json({
                message: "No courses Found",
                data: [],
                currentPage: page,
                hasNextPage: false,
                hasPrevPage,
                totalPages: 0,
                totalCourses: 0
            }, { status: 200 })
        }
        logger.info("Courses fetched successfully", { totalCourses, page, limit });
        const responseData: IGetCourseByParamsResponse = {
            paginatedCourses: serializeCourses(courses),
            currentPage: page,
            hasNextPage,
            hasPrevPage,
            totalPages: totalPages,
            totalCourses: totalCourses
        };
        await setCached(COURSES_FILTERED_BY_PARAMS.namespace, cacheId, responseData, CACHE_TTL.MEDIUM);
        return NextResponse.json({
            message: "Courses Fetched Succesfully",
            data: serializeCourses(courses),
            currentPage: page,
            hasNextPage,
            hasPrevPage,
            totalPages,
            totalCourses

        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error fetching courses:", { error: message });
        return NextResponse.json({ message: ` Error fetching courses` }, { status: 500 });
    }
}