import React from "react";
import ManageCoursePageComponent from "./components/ManageCoursePage/ManageCoursePage";
import { connectDB, logger } from "@repo/shared";
import { JSX } from "react/jsx-runtime";
import { auth } from "@/auth";
import { ICourse,Course } from "@repo/shared";
import { getCached, setCached, CACHE_TTL } from "@repo/shared/config/redisConfig/cache-helper";

import { CCourse, CReview } from "@/types/client";
import { serializeCourses } from "@/utils/serializer/course.Serializer";



async function ManagePage(): Promise<JSX.Element> {

  try {
    await connectDB(process.env.MONGODB_URI!);
    const usersSession = await auth();
    
     if (!usersSession?.user?.id) {
      return <ManageCoursePageComponent fetchedCourses={[]} />;
    }
   const authenticatedUserId = usersSession.user.id;
    const cacheNamespace = `courses:user:${authenticatedUserId}`;
     let courses: CCourse[] = [];
    const cachedUserCourses = await getCached<CCourse[]>(cacheNamespace, "all");
    if (cachedUserCourses) {
      courses = cachedUserCourses;
    } else {
      const rawCourses = await Course.find({ instructor: authenticatedUserId })
        .populate("instructor", "name email")
        .populate("enrolledStudents.user", "_id name email profileImage role")
        .lean();

      if (rawCourses.length > 0) {
        courses = serializeCourses(rawCourses) as CCourse[];
        await setCached(cacheNamespace, "all", courses, CACHE_TTL.MEDIUM);
      }
    }
   
    return <ManageCoursePageComponent fetchedCourses={courses} />;

  } catch (error:unknown) {
    logger.error("Error in ManagePage:", {error});
    return <ManageCoursePageComponent fetchedCourses={[]} />;
  }
};

export default ManagePage;
