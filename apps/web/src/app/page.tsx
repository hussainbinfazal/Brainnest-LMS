import HomePage from "./components/home/Homepage";
import "@/config/redis/redis";
import { CCategory, CCourse, CReview } from "@/types/client";
import { JSX } from "react/jsx-runtime";
import { Category, connectDB, ICategory, IReview, logger, Review } from "@repo/shared";
import { getCoursesWithCache } from "@/lib/getCachedCourse";
import { getReviewsWithCache } from "@/lib/getCachedReviews";
import { buildCategoryTree, getCategoriesWithCache } from "@/lib/getCachedCategory";



export default async function Home(): Promise<JSX.Element> {
  const [courses, reviews, categories] = await Promise.all([getCoursesWithCache(), getReviewsWithCache(), getCategoriesWithCache()]);
  // const processedCategory = buildCategoryTree(categories);
//     /[
//   {
//     _id: "...",
//     name: "Development",
//     children: [
//       { _id: "...", name: "Web" },
//       { _id: "...", name: "Mobile" }
//     ]
//   },
//   {
//     _id: "...",
//     name: "Business",
//     children: [
//       { _id: "...", name: "Marketing" }
//     ]
//   }
// ]
  return (
    <HomePage initialCourses={courses} fetchedReviews={reviews} allCategories={categories} />
  )
}
