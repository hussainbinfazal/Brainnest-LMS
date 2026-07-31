import { JSX } from "react/jsx-runtime";
import { CoursesPageComp } from "../components/CoursesComp/CoursesPageComp";
import { fetchServerCourses } from "@/lib/fetchCourse";
import { CCourse } from "@/types/client";
import { serializeCourses } from "@/utils/serializer/course.Serializer";
import { logger, ICourse } from "@repo/shared";
import { getCached, setCached, CACHE_TTL } from "@repo/shared/config/redisConfig/cache-helper";



export default async function CoursesPage(): Promise<JSX.Element> {

  let courses: CCourse[] = [];
  const cacheCoursesKey: string = `Courses:all`;
  logger.info("Fetching courses for CoursesPage",{ cacheCoursesKey });
  // console.log("Redis Client:", redisClient);
  const cachedCourses: CCourse[] | null = await getCached<CCourse[]>(cacheCoursesKey, "all")
  // logger.debug({ cachedCourses }, "Cached Courses");
  if (cachedCourses) {
    courses = JSON.parse(JSON.stringify(cachedCourses)) as CCourse[];
  } else {
    const rawCourses: ICourse[] = await fetchServerCourses({ page: 1, paginatedAllCourses: true, limit: 5 });
    if (rawCourses) {
      courses = serializeCourses(rawCourses) as CCourse[];
      await setCached(`Courses`, "all", courses,CACHE_TTL.MEDIUM); // 10 min
    }
  }
  return <CoursesPageComp initialCourses={courses} />;
};


