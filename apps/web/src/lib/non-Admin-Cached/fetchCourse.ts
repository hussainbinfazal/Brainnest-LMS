import axios from "axios";
import { CCourse, CReview } from "@/types/client";
import { ICourse } from "@repo/shared";
import { logger } from "@/utils/logger/logger.node";


interface fetchSampleCoursesProps {
  page?: number;
  limit?: number;
  paginatedAllCourses?: boolean;
}
export async function fetchServerCourses({ page = 0, paginatedAllCourses = false, limit = 5 }: fetchSampleCoursesProps = {}): Promise<ICourse[]> {
  console.log("Fetching server courses");
  try {
    if (paginatedAllCourses) {
      const res = await axios.get(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_API_URL_DEV : process.env.NEXT_PUBLIC_API_URL}/api/courses?page=${page}&limit=${limit}`);
      logger.info("Fetched paginated courses server side fetched Successfully");
      return res.data.data;
    } else {
      const res = await axios.get(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_API_URL_DEV : process.env.NEXT_PUBLIC_API_URL}/api/course`);
      return res.data;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Something went wrong on Fetch Server Courses';
    logger.error("Error fetching courses:", { error: message });
    return [];
  }
}
// export async function fetchSampleReviews(): Promise<Review[]> {
//   try {
//     const res = await axios.get(`${process.env.NODE_ENV=== 'development' ? process.env.NEXT_PUBLIC_API_URL_DEV : process.env.NEXT_PUBLIC_API_URL}/reviews/reviews.json`);
//     return res.data;
//   } catch (err) {
//     console.error("Error fetching courses", err);
//     return [];
//   }
// }
