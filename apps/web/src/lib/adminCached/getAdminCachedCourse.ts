import { getSession } from "@/dev/auth-helper";
import { CCourse } from "@/types/client";
import { serializeCourses } from "@/utils/serializer/course.Serializer";
import { connectDB, Course, COURSES_ALL, ICourse, INSTRUCTOR_COURSES_ALL, ISessionUser, logger, validateMongooseId } from "@repo/shared";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import { Session } from "next-auth";

export async function getInstructorCoursesWithCache(instructorId: string): Promise<CCourse[]> {
    const session: Session | null = await getSession()
    if (!session?.user) {
        logger.warn("Unauthorized", { user: session?.user })
        return []
    }
    const user: ISessionUser | null = session?.user
    // const user = await getSession()
    if (user?.role !== "instructor") {
        logger.error("Unauthorized", { user })
        return []
    }
    if (!validateMongooseId({ userId: instructorId })) {
        logger.error("Invalid user id", { userId: instructorId });
        return [];
    }
    const cachedInstructorCourses = await getCached<CCourse[]>(INSTRUCTOR_COURSES_ALL.namespace, instructorId);
    if (cachedInstructorCourses) {
        logger.info("Courses fetched Succesfully from Cache", {
            courseCount: cachedInstructorCourses.length
        })
        return cachedInstructorCourses;
    }
    // await invaidateCached("Courses", "all")
    // console.log("This is the url of mongodb", process.env.MONGODB_URI)
    await connectDB(process.env.MONGODB_URI!);
    try {
        const courses: ICourse[] = await Course.find({ instructorId: instructorId })
            .populate("instructorId", "_id name email")
            .populate({
                path: "category",
                select: "name slug parent",
                populate: {
                    path: "parent",
                    select: "name slug"

                },
            })
            .limit(50)
            .lean({ virtuals: true })
            .exec();

        const serializedInstructorCourses = serializeCourses(courses);
        await setCached(INSTRUCTOR_COURSES_ALL.namespace, instructorId, serializedInstructorCourses, CACHE_TTL.MEDIUM);
        logger.info("Instructor Courses fetched Succesfully from DB", {
            courseCount: courses.length
        })
        return serializedInstructorCourses
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Something went wrong while fetching instructor courses';
        logger.error("Error fetching courses", { message, cachedCourses: cachedInstructorCourses, error });
        return [];
    }
};