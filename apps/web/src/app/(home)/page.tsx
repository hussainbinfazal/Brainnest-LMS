import HomePage from "../components/home/Homepage";
import { JSX } from "react/jsx-runtime";
import { CCategory, CCourse, CReview } from "@/types/client";
import { getCoursesWithCache } from "@/lib/getCachedCourse";
import { getReviewsWithCache } from "@/lib/getCachedReviews";
import { getCategoriesWithCache } from "@/lib/getCachedCategory";

export default async function Home(): Promise<JSX.Element> {
  const [courses, reviews, categories] = await Promise.all([
    getCoursesWithCache(),
    getReviewsWithCache(),
    getCategoriesWithCache(),
  ]);

  return (
    <HomePage
      initialCourses={courses}
      fetchedReviews={reviews}
      allCategories={categories}
    />
  );
}