import { fetchServerCourses } from "@/lib/fetchCourse";
import HomePage from "./components/home/Homepage";
import { redisClient } from "@/config/redis/redis";
import { CCourse, CReview } from "@/types/client";
import { JSX } from "react/jsx-runtime";
import { serializeCourses } from "@/utils/serializer/course.Serializer";



// import HomePage2 from "./components/Homepage2";


export default async function Home(): Promise<JSX.Element> {
  let courses: CCourse[] = [];
  const rawCourses = await fetchServerCourses();
  if (rawCourses.length > 0) courses = serializeCourses(rawCourses) as CCourse[];
  let reviewCacheKey = `reviews:courses:${'all'}`;
  const cachedReviewsRaw: string | null = await redisClient.get(reviewCacheKey);
  // await redisClient.del("reviews:courses:all");
  let cachedReviews: CReview[] | null = null;
  if (cachedReviewsRaw) {
    try {
      cachedReviews = JSON.parse(JSON.stringify(cachedReviewsRaw)) as CReview[]
    } catch (e: any) {
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
    }
  } else {
    initialReviews = cachedReviews;
  }
  const normalizedReviews = initialReviews.map((rev) => {
    let user = rev.user;

    // If user is already the correct shape → use it
    if (user && typeof user === "object" && "name" in user) {
      return {
        ...rev,
        // createdAt:
        //   rev.createdAt instanceof Date
        //     ? rev.createdAt.toISOString()
        //     : rev.createdAt ?? "",
        // updatedAt:
        //   rev.updatedAt instanceof Date
        //     ? rev.updatedAt.toISOString()
        //     : rev.updatedAt ?? "",
        user: {
          name: user.name ?? "",
          profileImage: user.profileImage ?? "",
        },
      };
    }

    // If user is ObjectId or undefined → convert to safe object
    return {
      ...rev,
      user: {
        name: "",
        profileImage: "",
      },
      // createdAt:
      //   rev.createdAt instanceof Date
      //     ? rev.createdAt.toISOString()
      //     : rev.createdAt ?? "",
      // updatedAt:
      //   rev.updatedAt instanceof Date
      //     ? rev.updatedAt.toISOString()
      //     : rev.updatedAt ?? "",
    };
  });

  return (
    <HomePage initialCourses={courses} fetchedReviews={normalizedReviews} />
  )
}
