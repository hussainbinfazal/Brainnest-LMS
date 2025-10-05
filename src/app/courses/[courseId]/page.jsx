
import CourseIdPage from "@/app/components/CourseID/CourseIdPage";
import { connectDB } from "@/config/db";
import Course from "@/models/course/courseModel";
import User from "@/models/userModel";




async function CoursePage({ params }) {
  await connectDB();
  console.log("Params received:", params); // 👈 debug
  const awaitedParams = await params;
  const { courseId } = awaitedParams;
  const course = await Course.findById(courseId)
    .select("title description coverImage rating price category lessons.name lessons.duration instructor reviews")
    .populate("instructor", "name profileImage")
    .lean();

     let initialReviews = [];
  try {
    const res = await fetch(
      `${process.env.NODE_ENV === "development" 
        ? process.env.NEXT_PUBLIC_API_URL_DEV 
        : process.env.NEXT_PUBLIC_API_URL}/reviews/reviews.json`
    );
    initialReviews = await res.json();
  } catch (err) {
    console.error("Error fetching reviews:", err);
  }
  return <CourseIdPage initialCourse={JSON.parse(JSON.stringify(course)) } initialReviews={initialReviews} />;
}

export default CoursePage;