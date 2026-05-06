import axios from "axios";
import { CCourse, CReview } from "@/types/client";
import { ICourse } from "@/types/model";
import { logger } from "@/utils/logger/logger.node";


interface fetchSampleCoursesProps {
  page?: number;
  limit?: number;
  paginatedAllCourses?: boolean;
}
export async function fetchServerCourses({ page = 0, paginatedAllCourses = false, limit = 5 }: fetchSampleCoursesProps = {}): Promise<ICourse[]> {
  try {
    if (paginatedAllCourses) {
      const res = await axios.get(`${process.env.NODE_ENVIRONMENT === 'development' ? process.env.NEXT_PUBLIC_API_URL_DEV : process.env.NEXT_PUBLIC_API_URL}/api/courses?page=${page}&limit=${limit}`);
      logger.info({ res }, "Fetched paginated courses server side");
      return res.data.data;
    } else {
      const res = await axios.get(`${process.env.NODE_ENVIRONMENT === 'development' ? process.env.NEXT_PUBLIC_API_URL_DEV : process.env.NEXT_PUBLIC_API_URL}/api/course`);
      return res.data;
    }
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error("Error fetching courses:", message);
    return [];
  }
}
// export async function fetchSampleReviews(): Promise<Review[]> {
//   try {
//     const res = await axios.get(`${process.env.NODE_ENVIRONMENT === 'development' ? process.env.NEXT_PUBLIC_API_URL_DEV : process.env.NEXT_PUBLIC_API_URL}/reviews/reviews.json`);
//     return res.data;
//   } catch (err) {
//     console.error("Error fetching courses", err);
//     return [];
//   }
// }
