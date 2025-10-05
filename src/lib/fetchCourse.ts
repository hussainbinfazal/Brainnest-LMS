import axios from "axios";
import { Course, Review } from "@/types/client";

export async function fetchServerCourses(): Promise<Course[]> {
  try {
    const res = await axios.get(`${process.env.NODE_ENVIRONMENT === 'development' ? process.env.NEXT_PUBLIC_API_URL_DEV : process.env.NEXT_PUBLIC_API_URL}/api/course`);
    return res.data;
  } catch (err) {
    console.error("Error fetching courses", err);
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
