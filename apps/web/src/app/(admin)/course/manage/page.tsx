import React from "react";
import ManageCoursePageComponent from "@/app/components/AdminComp/InstructorComp/ManageCoursePageComp";
import { ISessionUser, logger, validateMongooseId } from "@repo/shared";
import { JSX } from "react/jsx-runtime";
import { getSession } from "@/dev/auth-helper";
import { notFound } from "next/navigation";
import { Session } from "next-auth";
import { getInstructorCoursesWithCache } from "@/lib/adminCached/getAdminCachedCourse";



async function ManagePage(): Promise<JSX.Element> {
  try {
    const session: Session | null = await getSession() // replace actual next auth in prod
    if (!session?.user) {
      return notFound()
    }
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
    const cachedInstructorCourses = await getInstructorCoursesWithCache(instructorId)
    logger.info("Instructor Courses fetched from cache", { courseCount: cachedInstructorCourses.length });
    return <ManageCoursePageComponent fetchedCourses={cachedInstructorCourses} />
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong while fetching Instructor Courses";
    logger.error("Error in ManagePage:", { error, message });
    return <ManageCoursePageComponent fetchedCourses={[]} />;
  }
};

export default ManagePage;
