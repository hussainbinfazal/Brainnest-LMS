


import CourseIdPage from "@/app/components/CourseIDComp/CourseIdPageComp";
import { connectDB } from "@/config/mongoDB/db";
import { redisClient } from "@/config/redis/redis";
import { JSX } from "react/jsx-runtime";
import { CCourse, CReview } from "@/types/client";
import { ICourse } from "@/types/model";
import Course from "@/models/Course/courseModel";
import { serializeDocument } from "@/utils/serializer/serializeDocument";
import { serializeCourse } from "@/utils/serializer/course.Serializer";
import { logger } from "@/utils/logger/logger";

async function CoursePage({ params }: { params: { courseId: string } }): Promise<JSX.Element> {
  await connectDB();
  logger.debug({ params }, "Params received"); // 👈 debug
  const awaitedParams = await params;
  const { courseId } = awaitedParams;
  logger.debug({ awaitedParams }, "Params awaited");
  const cacheCourseKey: string = `course:${courseId}`;
  const cachedCourse: CCourse | null = await redisClient.get(cacheCourseKey);
  let course: CCourse | null = null;
  let stringParsedCourse: CCourse | null = null;
  if (cachedCourse) {
    course = cachedCourse as CCourse;
  } else {
    const rawCourse: ICourse | null = (await Course.findById(courseId)
      .select("title description coverImage rating price category lessons.name lessons.duration instructor reviews")
      .populate("instructor", "name profileImage")
      .lean())
    if (rawCourse) {
      course = await serializeCourse(rawCourse) as CCourse;
      await redisClient.set(cacheCourseKey, JSON.stringify(course) as string, { ex: 600 }); // 10 min
    }
  }
  // const course = await Course.findById(courseId)
  //   .select("title description coverImage rating price category lessons.name lessons.duration instructor reviews")
  //   .populate("instructor", "name profileImage")
  //   .lean();
  let reviewCacheKey = `reviews:course:${courseId}`;
  const cachedReviewsRaw = await redisClient.get(reviewCacheKey);

  let cachedReviews: CReview[] | null = null;
  logger.debug({ cachedReviewsRaw }, "Cached Reviews Raw");
  if (cachedReviewsRaw) {
    try {
      cachedReviews = JSON.parse(JSON.stringify(cachedReviewsRaw)) as CReview[]
    } catch (e: any) {
      logger.error(e, "Error parsing cached reviews");
    }
  }

  let initialReviews: CReview[] = [];
  if (!cachedReviews) {
    try {
      const res = await fetch(
        `${process.env.NODE_ENV === "development"
          ? process.env.NEXT_PUBLIC_API_URL_DEV
          : process.env.NEXT_PUBLIC_API_URL}/reviews/reviews.json`
      );
      initialReviews = await res.json();

      await redisClient.set(reviewCacheKey, JSON.stringify(initialReviews) as string, { ex: 600 });


    } catch (err: any) {
      logger.error(err, "Error fetching reviews");
    }
  } else {
    initialReviews = cachedReviews;
  }
  return <CourseIdPage initialCourse={JSON.parse(JSON.stringify(course))} initialReviews={initialReviews} />;
}

export default CoursePage;