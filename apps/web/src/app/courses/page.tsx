// import "@/config/redis/redis"; // Make sure to import this file to use redis serverless instance 
import { JSX } from "react/jsx-runtime";
import { logger, COURSES_ALL } from "@repo/shared";
import { getCourseByParamsWithCache, getCoursesWithCache } from "@/lib/non-Admin-Cached/getCachedCourse";
import CoursesPageComp from "../components/CoursesComp/CoursesPageComp";
import { getCategoriesWithCache } from "@/lib/non-Admin-Cached/getCachedCategory";
import { getSidebarFacets } from "@/lib/actions/getSidebarFacets";
import { auth } from "@/auth";


type CoursesPageProps = {
  searchParams: Promise<{
    page?: string,
    limit?: string,
  }>
}

export default async function CoursesPage({ searchParams }: CoursesPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const page: number = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const limit: number = Math.max(
    1, Number.parseInt(params.limit ?? "5", 10) || 5
  );
  const skip: number = (page - 1) * limit;

  // const userSession = await auth();
  const userSession = await auth()
  // console.log("This is user session on server", userSession);
  if (!userSession?.user?.id) {
    logger.warn("User not authenticated");
  }
  const [courses, pagCourses, categories, cachedFacets] = await Promise.all([
    getCoursesWithCache(),
    getCourseByParamsWithCache(page, limit, skip),
    getCategoriesWithCache(),
    getSidebarFacets(),
  ]);
  let cachedCoursesKey = `${COURSES_ALL.namespace}:${COURSES_ALL.id}`;

  logger.info("Fetching courses for CoursesPage, paginatedCourses", { cachedCoursesKey, page, limit, skip });
  // console.log("Redis Client:", redisClient);
  return <CoursesPageComp initialCourses={courses} pagCourses={pagCourses} categoriesWithChildren={categories}
    initialFacetsCategories={cachedFacets.facetsCategories} initialFacetsLanguages={cachedFacets.facetsLanguages} initialFacetsLevels={cachedFacets.facetsLevel} />;
};


