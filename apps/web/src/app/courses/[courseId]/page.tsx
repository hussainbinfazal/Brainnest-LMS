


import CourseIdPage from "@/app/components/CourseIDComp/CourseIdPageComp";
import { connectDB } from "@repo/shared";
import { JSX } from "react/jsx-runtime";
import { CCourse, CReview } from "@/types/client";
import { Course,ICourse } from "@repo/shared";
import { getCached, setCached, CACHE_TTL } from "@repo/shared/config/redisConfig/cache-helper";

import { serializeCourse } from "@/utils/serializer/course.Serializer";
import { logger } from "@repo/shared";
import { notFound } from "next/navigation";

async function CoursePage({ params }: { params: { courseId: string } }): Promise<JSX.Element> {
  await connectDB(process.env.MONGODB_URI!);
  // logger.debug({ params }, "Params received"); // 👈 debug
  const awaitedParams = await params;
  const { courseId } = awaitedParams;
  // logger.debug({ awaitedParams }, "Params awaited");
  let course: CCourse | null  = await getCached<CCourse>("course", courseId);

  if (!course) {
    const rawCourse: ICourse = await Course.findById(courseId)
      .select("title description coverImage rating price category lessons.name lessons.duration instructor reviews")
      .populate("instructor", "name profileImage")
      .lean()
      .exec()
    if (rawCourse) {
      course = (serializeCourse(rawCourse)) as CCourse;
      await setCached("course", courseId, course, CACHE_TTL.MEDIUM); // 10 min
    }
  }

  if (!course) {
    notFound();
  }

  let initialReviews: CReview[] = (await getCached<CReview[]>("reviews:course", courseId)) ?? [];
  if (initialReviews.length === 0) {
    try {
      const res  : Response = await fetch(
        `${process.env.NODE_ENV === "development"
          ? process.env.NEXT_PUBLIC_API_URL_DEV
          : process.env.NEXT_PUBLIC_API_URL}/reviews/reviews.json`
      );
      initialReviews = await res.json();
      await setCached("reviews:course", courseId, initialReviews, CACHE_TTL.MEDIUM);
    } catch (error: unknown) {
      logger.error("Error fetching reviews", { error });

    }
  }
  return <CourseIdPage initialCourse={course} initialReviews={initialReviews} />;
}

export default CoursePage;