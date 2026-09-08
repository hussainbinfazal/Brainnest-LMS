import HomePage from "../components/home/Homepage";
import { JSX } from "react/jsx-runtime";
import { CCategory, CCourse, CReview } from "@/types/client";
import { getCoursesWithCache } from "@/lib/getCachedCourse";
import { getReviewsWithCache } from "@/lib/getCachedReviews";
import { getCategoriesWithCache } from "@/lib/getCachedCategory";
import { getSession } from "@/dev/auth-helper";
import { logger } from "@repo/shared";
import { getAllUserCourseByIdWithCache } from "@/lib/getCachedUserCourse";


export default async function Home(): Promise<JSX.Element> {
  const userSession = await getSession() //Replace it with actual next auth getSession
  console.log("This is user session on server", userSession);
  if (!userSession?.user?.id) {
    logger.warn("User not authenticated");
  }
  const [courses, reviews, categories, allUserCourses] = await Promise.all([
    getCoursesWithCache(),
    getReviewsWithCache(),
    getCategoriesWithCache(),
    userSession?.user?.id
      ? getAllUserCourseByIdWithCache(userSession.user.id)
      : Promise.resolve([]),
  ]);

  return (
    <HomePage
      initialCourses={courses}
      fetchedReviews={reviews}
      allCategories={categories}
      allUserCourses={allUserCourses}
    />
  );
}