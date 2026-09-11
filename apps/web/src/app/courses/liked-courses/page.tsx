import LikedCoursesPageComp from "@/app/components/LikedCourseComp/LikedCourseComp";
import { getSession } from "@/dev/auth-helper";
import { getUserLikedCoursesWithCache } from "@/lib/getCachedCourse";
import { CCourse } from "@/types/client";
import { IGetLikedCourseByParamsResponse } from "@/types/server";
import { logger } from "@repo/shared";
import { JSX } from "react/jsx-runtime";

type LikeCoursesPageProps = {
  searchParams: Promise<{
    page?: string,
    limit?: string,
  }>
}
export default async function LikedCoursesPage({ searchParams }: LikeCoursesPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const limit = Math.max(1, Number.parseInt(params.limit ?? "5", 10) || 5);
  const skip = (page - 1) * limit;
  const session = await getSession()
  const userId = session?.user?.id
  const likedUserCourses: IGetLikedCourseByParamsResponse = await getUserLikedCoursesWithCache(userId!, page, limit, skip);
  logger.info("User Liked Courses fetched successfully", { courseCount: likedUserCourses.likedCourses.length });
  return <LikedCoursesPageComp userLikedCourses={likedUserCourses.likedCourses} />;
};


