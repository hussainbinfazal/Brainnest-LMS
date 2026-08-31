import CourseIdPage from "@/app/components/CourseIDComp/CourseIdPageComp";
import "@/config/redis/redis"; // Make sure to import this file to use redis serverless instance 
import { connectDB, logger, Progress } from "@repo/shared";
import { JSX } from "react/jsx-runtime";
import { notFound } from "next/navigation";
import { getCourseByIdWithCache, getInstructorOtherCoursesWithCache, getInstructorStatsWithCache, getReleatedCoursesWithCache, getUserCourseWithCache, IInstructorStats } from "@/lib/getCachedCourse";
import { getCourseReviewsWithCache } from "@/lib/getCachedReviews";
import { buildCategoryTree, buildCourseCategoryTree, CCategoryWithChildren, getCategoriesWithCache } from "@/lib/getCachedCategory";
import {getUserProgressByIdWithCache } from "@/lib/getCachedUserProgress";
import { auth } from "@/auth";
import { getUserCourseByIdWithCache } from "@/lib/getCachedUserCourse";
import { getCachedTopic } from "@/lib/getCachedTopic";
import { getLessonsByIdWithCache } from "@/lib/getCachedLessons";
import { getSectionsByIdWithCache } from "@/lib/getCachedSections";
import { getSession } from "@/dev/auth-helper";

async function CoursePage({ params }: { params: { courseId: string } }): Promise<JSX.Element> {
  await connectDB(process.env.MONGODB_URI!);
  const awaitedParams = params;
  const { courseId } = await awaitedParams;
  if(!courseId || typeof courseId !== "string") {
     return notFound();
  }
  // const userSession = await auth();
  const userSession = await getSession()
  console.log("This is user session on server", userSession);
  if (!userSession?.user?.id) {
    logger.warn("User not authenticated", { courseId });
  }
  const [course, lessons, sections, reviews, categories, relevantCategoryCourses, userCourse, topic,progress] = await Promise.all([
    getCourseByIdWithCache(courseId),
    getLessonsByIdWithCache(courseId),
    getSectionsByIdWithCache(courseId),
    getCourseReviewsWithCache(courseId),
    getCategoriesWithCache(),
    getReleatedCoursesWithCache(courseId),
    userSession?.user?.id
        ? getUserCourseByIdWithCache(userSession.user.id, courseId)
        : Promise.resolve(null),
    getCachedTopic(courseId),
    userSession?.user?.id
        ? getUserProgressByIdWithCache(userSession.user.id,courseId)
        : Promise.resolve(null),
    
  ]);
  if (!course) {
    notFound();
  }
  // console.log("This is the course on server side", course)
  const categoriesWithChildren: CCategoryWithChildren[] = buildCategoryTree(categories);
  const categoryId = course?.category?.toString();
  if(!categoryId) logger.warn("Course has no resolvable category",{courseId: course._id});
  const courseCategoryWithChildren: CCategoryWithChildren | null = buildCourseCategoryTree(categories, categoryId);
  if(!course?.instructorId?._id) {
    logger.warn("Course instructorId is null", { courseId: course._id });
    throw new Error("Course instructorId is null");
  };
  let courseInstructorId:string = course?.instructorId._id.toString();
  const [instructorStats, instructorOtherCourses] = await Promise.all([
    getInstructorStatsWithCache(courseInstructorId),
    getInstructorOtherCoursesWithCache(courseInstructorId, courseId),
  ])

  if(!instructorStats) {
    logger.warn("Instructor stats is null", { courseId: course._id });
    throw new Error("Instructor stats is null");
  }

  return <CourseIdPage initialCourse={course} initialReviews={reviews} allCategories={categoriesWithChildren} courseCategory={courseCategoryWithChildren} relevantCategoryCourses={relevantCategoryCourses} instructorStats={instructorStats} userCourseStats={userCourse} otherCoursesByInstructor={instructorOtherCourses} initialTopic={topic} allLessons={lessons} allSections={sections} uProgress={progress}/>;
}

export default CoursePage