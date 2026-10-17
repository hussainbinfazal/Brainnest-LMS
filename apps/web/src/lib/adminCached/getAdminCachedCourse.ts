import { auth } from "@/auth";
import { CCourse, CLesson, CSection } from "@/types/client";
import { serializeCourse, serializeCourses } from "@/utils/serializer/course.Serializer";
import { connectDB, Course, COURSES_ALL, ICourse, ILesson, INSTRUCTOR_COURSE_WITH_ID, INSTRUCTOR_COURSES_ALL, ISection, ISessionUser, Lesson, logger, Section, validateMongooseId } from '@repo/shared/server';
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import { Session } from "next-auth";
import { serializeLessons } from "@/utils/serializer/lesson.serializer";
import { serializeSections } from "@/utils/serializer/section.serializer";
export type InstructorCoursesResponse = {
    paginatedInstructorCourses: CCourse[];
    hasNextPage: boolean;
    hasPrevPage: boolean;
    currentPage: number;
    totalPages: number;
    totalInstructorCourses: number;
}
export type InstructorCourseResponse = {
    course: CCourse | null;
    sections: CSection[];
    lessons: CLesson[];
}
///All Instructor Courses
export async function getInstructorCoursesWithCache(instructorId: string, page: number, limit: number, skip: number): Promise<{
    paginatedInstructorCourses: CCourse[],
    hasNextPage: boolean,
    hasPrevPage: boolean,
    currentPage: number,
    totalPages: number,
    totalInstructorCourses: number
}> {
    const session: Session | null = await auth()
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
            await Course.find({ instructorId: instructorId, isDeleted: false }, null, {
                sort: {
                    createdAt: -1
                }
            })
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

///Single course by instructor with particular courseId
export async function getInstructorCourseWithCache(instructorId: string, courseId: string): Promise<InstructorCourseResponse> {
    const session: Session | null = await auth()
    if (!session?.user) {
        logger.warn("Unauthorized", { user: session?.user })
        return {
            course: null,
            sections: [],
            lessons: []
        }
    }
    const user: ISessionUser | null = session?.user
    // const user = await getSession()
    if (user?.role !== "instructor") {
        logger.error("Unauthorized", { user })
        return {
            course: null,
            sections: [],
            lessons: []
        }
    }
    if (!validateMongooseId({ userId: instructorId })) {
        logger.error("Invalid User", { userId: instructorId });
        return {
            course: null,
            sections: [],
            lessons: []
        };
    };
    if (!validateMongooseId({ courseId: courseId })) {
        logger.error("Invalid Course Details in Instructor Cached Course", { courseId });
        return {
            course: null,
            sections: [],
            lessons: []
        };
    };
    const cacheId = `${courseId}:${instructorId}`;
    const cachedInstructorCourse = await getCached<InstructorCourseResponse>(INSTRUCTOR_COURSE_WITH_ID.namespace, cacheId);
    if (cachedInstructorCourse) {
        logger.info("Instructor Course fetched Succesfully from Cache", {
            courseId,
        })
        let response = {
            course: cachedInstructorCourse.course,
            sections: cachedInstructorCourse.sections,
            lessons: cachedInstructorCourse.lessons
        }
        return response;
    }
    // await invaidateCached("Courses", "all")
    // console.log("This is the url of mongodb", process.env.MONGODB_URI)
    await connectDB(process.env.MONGODB_URI!);
    try {
        const [instructorCourseFromDB, courseSectionsFromDB, courseLesonsFromDB] = await Promise.all([
            Course.findOne({ _id: courseId, instructorId: instructorId, isDeleted: false })
                .populate("instructorId", "_id name email")
                .populate({
                    path: "category",
                    select: "name slug parent",
                    populate: {
                        path: "parent",
                        select: "name slug"

                    },
                })
                .lean({ virtuals: true })
                .exec(),
            Section.find({ courseId: courseId }).sort({ order: 1 }).lean().exec(),
            Lesson.find({ courseId: courseId }).sort({ order: 1 }).lean().exec()
        ])
        if (!instructorCourseFromDB) {
            logger.error("Instructor Course not found", { courseId, instructorId });
            return {
                course: null,
                sections: [],
                lessons: []
            };
        }
        if (!courseSectionsFromDB || !Array.isArray(courseSectionsFromDB) || courseSectionsFromDB.length === 0 || !Array.isArray(courseLesonsFromDB) || courseLesonsFromDB.length === 0) {
            logger.error("Something went wrong while fetching instructor's course, sections and lessons", { courseId: courseId, instructorId: instructorId, sectionsLength: courseSectionsFromDB.length, lessonsLength: courseLesonsFromDB.length });
            return {
                course: null,
                sections: [],
                lessons: []
            };
        }

        logger.info("Instuctor Courses fetched successfully");

        let response = {
            course: serializeCourse(instructorCourseFromDB),
            sections: serializeSections(courseSectionsFromDB),
            lessons: serializeLessons(courseLesonsFromDB)
        }
        await setCached(INSTRUCTOR_COURSE_WITH_ID.namespace, cacheId, response, CACHE_TTL.MEDIUM);
        logger.info("Instructor Course fetched Succesfully from DB ")
        return response
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Something went wrong while fetching instructor courses';
        logger.error("Error fetching courses", { message, error });
        return {
            course: null,
            sections: [],
            lessons: []
        };
    }
}