import { fetchServerCourses } from "@/lib/fetchCourse";
import HomePage from "./components/home/Homepage";
import "@/config/redis/redis";
import { CCategory, CCourse, CReview } from "@/types/client";
import { JSX } from "react/jsx-runtime";
import { serializeCourses } from "@/utils/serializer/course.Serializer";
import { getCached, setCached, CACHE_TTL } from "@repo/shared/config/redisConfig/cache-helper";
import { Category, connectDB, ICategory, IReview, logger, Review } from "@repo/shared";
import { notFound } from "next/navigation";
import { serializeCategories, serializeReviews } from "@/utils/serializer/review.Serializer";
import { getCoursesWithCache } from "@/lib/getCachedCourse";
import { getReviewsWithCache } from "@/lib/getCachedReviews";
import { buildCategoryTree, getCategoriesWithCache } from "@/lib/getCachedCategory";



export default async function Home(): Promise<JSX.Element> {
  await connectDB(process.env.MONGODB_URI!)
  const courses: CCourse[] = await getCoursesWithCache()
  const reviews : CReview[] = await getReviewsWithCache()
  const categories : CCategory[] = await getCategoriesWithCache()
  const processedCategory = buildCategoryTree(categories);
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
    <HomePage initialCourses={courses} fetchedReviews={reviews} allCategories={processedCategory} />
  )
}
