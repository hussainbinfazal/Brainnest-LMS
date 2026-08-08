import CourseIdPage from "@/app/components/CourseIDComp/CourseIdPageComp";
import { connectDB, IUserCourse, logger } from "@repo/shared";
import { JSX } from "react/jsx-runtime";
import { CCategory, CCourse, CReview } from "@/types/client";
import { notFound } from "next/navigation";
import { getCourseByIdWithCache, getInstructorOtherCoursesWithCache, getInstructorStatsWithCache, getReleatedCoursesWithCache, getUserCourseWithCache, IInstructorStats } from "@/lib/getCachedCourse";
import { getCourseReviewsWithCache } from "@/lib/getCachedReviews";
import { buildCategoryTree, buildCourseCategoryTree, CCategoryWithChildren, getCategoriesWithCache } from "@/lib/getCachedCategory";
import { auth } from "@/auth";
import { getUserCourseByIdWithCache } from "@/lib/getCachedUserCourse";

async function CoursePage({ params }: { params: { courseId: string } }): Promise<JSX.Element> {
  await connectDB(process.env.MONGODB_URI!);
  const awaitedParams = params;
  const { courseId } = awaitedParams;
  if(!courseId || typeof courseId !== "string") {
     return notFound();
  }
  const userSession = await auth();
  if (!userSession?.user?.id) {
    logger.warn("User not authenticated", { courseId });
  }
  const [course, reviews, categories, relevantCategoryCourses, userCourse] = await Promise.all([
    getCourseByIdWithCache(courseId),
    getCourseReviewsWithCache(courseId),
    getCategoriesWithCache(),
    getReleatedCoursesWithCache(courseId),
    userSession?.user?.id
        ? getUserCourseByIdWithCache(userSession.user.id, courseId)
        : Promise.resolve(null),
  ]);
  if (!course) {
    notFound();
  }
  const categoriesWithChildren: CCategoryWithChildren[] = buildCategoryTree(categories);
  const courseCategoryWithChildren: CCategoryWithChildren | null = buildCourseCategoryTree(categories, course?.category?._id!.toString() ?? "");
  if(!course.instructorId) {
    logger.warn("Course instructorId is null", { courseId: course._id });
    throw new Error("Course instructorId is null");
  }
  let courseInstructorId :string = course.instructorId._id.toString();
  const [instructorStats, instructorOtherCourses] = await Promise.all([
    getInstructorStatsWithCache(courseInstructorId),
    getInstructorOtherCoursesWithCache(courseInstructorId),
  ])

  if(!instructorStats) {
    logger.warn("Instructor stats is null", { courseId: course._id });
    throw new Error("Instructor stats is null");
  }

  return <CourseIdPage initialCourse={course} initialReviews={reviews} allCategories={categoriesWithChildren} courseCategory={courseCategoryWithChildren} relevantCategoryCourses={relevantCategoryCourses} instructorStats={instructorStats} userCourse={userCourse} otherCoursesByInstructor={instructorOtherCourses}/>;
}

export default CoursePage;