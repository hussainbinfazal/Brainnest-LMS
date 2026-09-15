import HomePage from "../components/home/Homepage";
import { JSX } from "react/jsx-runtime";
import { getCoursesWithCache } from "@/lib/non-Admin-Cached/getCachedCourse";
import { getReviewsWithCache } from "@/lib/non-Admin-Cached/getCachedReviews";
import { getCategoriesWithCache } from "@/lib/non-Admin-Cached/getCachedCategory";
import { logger } from "@repo/shared";
import { getAllUserCourseByIdWithCache } from "@/lib/non-Admin-Cached/getCachedUserCourse";
import { auth } from "@/auth";


export default async function Home(): Promise<JSX.Element> {
  const userSession = await auth()
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