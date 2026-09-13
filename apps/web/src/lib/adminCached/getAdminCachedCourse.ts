import { getSession } from "@/dev/auth-helper";
import { CCourse } from "@/types/client";
import { serializeCourses } from "@/utils/serializer/course.Serializer";
import { connectDB, Course, COURSES_ALL, ICourse, INSTRUCTOR_COURSES_ALL, ISessionUser, logger, validateMongooseId } from "@repo/shared";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import { Session } from "next-auth";
export type InstructorCoursesResponse = {
    paginatedInstructorCourses: CCourse[];
    hasNextPage: boolean;
    hasPrevPage: boolean;
    currentPage: number;
    totalPages: number;
    totalInstructorCourses: number;
}
export async function getInstructorCoursesWithCache(instructorId: string, page: number, limit: number, skip: number): Promise<{
    paginatedInstructorCourses: CCourse[],
    hasNextPage: boolean,
    hasPrevPage: boolean,
    currentPage: number,
    totalPages: number,
    totalInstructorCourses: number
}> {
    const session: Session | null = await getSession()
    if (!session?.user) {
        logger.warn("Unauthorized", { user: session?.user })
        return {
            paginatedInstructorCourses: [] as CCourse[],
            hasNextPage: false,
            hasPrevPage: false,
            currentPage: page,
            totalPages: 1,
            totalInstructorCourses: 0
        }
    }
    const user: ISessionUser | null = session?.user
    // const user = await getSession()
    if (user?.role !== "instructor") {
        logger.error("Unauthorized", { user })
        return {
            paginatedInstructorCourses: [] as CCourse[],
            hasNextPage: false,
            hasPrevPage: false,
            currentPage: page,
            totalPages: 1,
            totalInstructorCourses: 0
        }
    }
    if (!validateMongooseId({ userId: instructorId })) {
        logger.error("Invalid user id", { userId: instructorId });
        return {
            paginatedInstructorCourses: [] as CCourse[],
            hasNextPage: false,
            hasPrevPage: false,
            currentPage: page,
            totalPages: 1,
            totalInstructorCourses: 0
        };
    }

    const cacheId = `${page}-${limit}-${skip}-${instructorId}`;
    const cachedInstructorCourses = await getCached<InstructorCoursesResponse>(INSTRUCTOR_COURSES_ALL.namespace, cacheId);
    if (cachedInstructorCourses) {
        logger.info("Courses fetched Succesfully from Cache", {
            courseCount: cachedInstructorCourses.paginatedInstructorCourses.length
        })
        let response = {
            paginatedInstructorCourses: cachedInstructorCourses.paginatedInstructorCourses,
            hasNextPage: false,
            hasPrevPage: false,
            currentPage: page,
            totalPages: 1,
            totalInstructorCourses: cachedInstructorCourses.paginatedInstructorCourses.length
        }
        return response;
    }
    // await invaidateCached("Courses", "all")
    // console.log("This is the url of mongodb", process.env.MONGODB_URI)
    await connectDB(process.env.MONGODB_URI!);
    try {
        const [totalInstructorCourseDoc, instructorCoursesInDB] = await Promise.all([
            Course.countDocuments({ instructorId: instructorId }),
            await Course.find({ instructorId: instructorId })
                .populate("instructorId", "_id name email")
                .populate({
                    path: "category",
                    select: "name slug parent",
                    populate: {
                        path: "parent",
                        select: "name slug"

                    },
                })
                .skip(skip)
                .limit(50)
                .lean({ virtuals: true })
                .exec()

        ])

        const totalCourses: number = totalInstructorCourseDoc;
        logger.info("Instuctor Courses fetched successfully", { totalCourses, page, limit });
        const totalPages: number = Math.ceil(totalCourses / limit);
        const hasNextPage: boolean = page < totalPages;
        const hasPrevPage: boolean = page > 1;
        let response = {
            paginatedInstructorCourses: serializeCourses(instructorCoursesInDB),
            hasNextPage,
            hasPrevPage,
            currentPage: page,
            totalPages: Math.ceil(totalCourses / limit),
            totalInstructorCourses: totalCourses
        }

        const serializedInstructorCourses = serializeCourses(instructorCoursesInDB);
        await setCached(INSTRUCTOR_COURSES_ALL.namespace, cacheId, response, CACHE_TTL.MEDIUM);
        logger.info("Instructor Courses fetched Succesfully from DB", {
            courseCount: serializedInstructorCourses.length
        })
        return response
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Something went wrong while fetching instructor courses';
        logger.error("Error fetching courses", { message, cachedCourses: cachedInstructorCourses, error });
        return {
            paginatedInstructorCourses: [] as CCourse[],
            hasNextPage: false,
            hasPrevPage: false,
            currentPage: page,
            totalPages: 1,
            totalInstructorCourses: 0
        };
    }
};