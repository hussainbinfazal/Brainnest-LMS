import React from "react";
import ManageCoursePageComponent from "@/app/components/AdminComp/InstructorComp/ManageCoursePageComp";
import { ISessionUser, logger, validateMongooseId } from "@repo/shared";
import { JSX } from "react/jsx-runtime";
import { getSession } from "@/dev/auth-helper";
import { notFound } from "next/navigation";
import { Session } from "next-auth";
import { getInstructorCoursesWithCache } from "@/lib/adminCached/getAdminCachedCourse";

type ManageCoursesPageProps = {
  searchParams: Promise<{
    page?: string,
    limit?: string,
  }>
}
async function ManageInstructorsCoursesPage({ searchParams }: ManageCoursesPageProps): Promise<JSX.Element> {
  try {
    const session: Session | null = await getSession() // replace actual next auth in prod
    if (!session?.user) {
      return notFound()
    }
    const params = await searchParams;
    const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
    const limit = Math.max(1, Number.parseInt(params.limit ?? "5", 10) || 5);
    const skip = (page - 1) * limit;
    const user: ISessionUser = session?.user;
    if (user?.role !== "instructor") {
      logger.warn("Unauthorized", { user });
      return notFound()
    }
    const instructorId: string = user.id
    if (!validateMongooseId({ userId: instructorId })) {
      logger.warn("Invalid user id", { userId: instructorId });
      return notFound()
    }
    const cachedInstructorCourses = await getInstructorCoursesWithCache(instructorId, page, limit, skip);
    logger.info("Instructor Courses fetched from cache", { courseCount: cachedInstructorCourses.paginatedInstructorCourses.length });
    return <ManageCoursePageComponent coursesProps={cachedInstructorCourses} />
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong while fetching Instructor Courses";
    logger.error("Error in ManagePage:", { error, message });
    return <ManageCoursePageComponent coursesProps={} />;
  }
};

export default ManageInstructorsCoursesPage;
