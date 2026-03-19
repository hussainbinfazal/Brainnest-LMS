import { JSX } from "react/jsx-runtime";
import { CoursesPageComp } from "../components/CoursesComp/CoursesPageComp";
import { redisClient } from "@/config/redis/redis";
import { fetchServerCourses } from "@/lib/fetchCourse";
import { CCourse } from "@/types/client";
import { serializeCourses } from "@/utils/serializer/course.serializer";
import { logger } from "@/utils/logger/logger";
import { ICourse } from "@/types/model";



export default async function CoursesPage(): Promise<JSX.Element> {

  let courses: CCourse[] = [];
  const cacheCoursesKey: string = `courses:all`;
  logger.debug({ cacheCoursesKey }, "Fetching courses for CoursesPage");
  // console.log("Redis Client:", redisClient);
  const cachedCourses: CCourse | null = await redisClient.get(cacheCoursesKey);
  logger.debug({ cachedCourses }, "Cached Courses");
  if (cachedCourses) {
    courses = JSON.parse(JSON.stringify(cachedCourses)) as CCourse[];
  } else {
    const rawCourses: ICourse[] = await fetchServerCourses({ page: 1, paginatedAllCourses: true, limit: 5 });
    if (rawCourses) {
      courses = await serializeCourses(rawCourses) as CCourse[];

      await redisClient.set(cacheCoursesKey, JSON.stringify(courses) as string, { ex: 600 }); // 10 min
    }
  }
  return <CoursesPageComp initialCourses={courses} />;
};


