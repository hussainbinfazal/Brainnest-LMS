import { fetchServerCourses } from "@/lib/non-Admin-Cached/fetchCourse";
import HomePage from "./components/Homepage";
import { Course } from "@/types/client";
// import HomePage2 from "./components/Homepage2";
export default async function Home() {
  const courses: Course[] = await fetchServerCourses();
  return (
    <HomePage initialCourses={courses} />
  )
}
