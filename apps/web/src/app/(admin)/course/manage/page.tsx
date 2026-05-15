import React from "react";
import ManageCoursePageComponent from "./components/ManageCoursePage/ManageCoursePage";
import { connectDB } from "@/config/mongoDB/db";
import { JSX } from "react/jsx-runtime";
import { auth } from "@/auth";
import { ICourse } from "@/types/model";
import { CCourse, CReview } from "@/types/client";
import { redisClient } from "@/config/redis/redis";
import Course from "@/models/Course/courseModel";
import { serializeCourses } from "@/utils/serializer/course.Serializer";



async function ManagePage(): Promise<JSX.Element> {

  try {
    await connectDB();
    const usersSession = await auth();
    const authenticatedUserId: string = usersSession?.user.id || "";
    const cachedUsersCoursesKey: string = `courses:user:${authenticatedUserId}`;
    const cachedUserCourses: string | null = await redisClient.get(cachedUsersCoursesKey);
    let courses: CCourse[] = [];
    if (cachedUserCourses) {
      if (typeof cachedUserCourses === "string") {
        courses = JSON.parse(cachedUserCourses) as CCourse[]
      }
    } else {
      const rawCourse = (
        await Course.find({ instructor: authenticatedUserId })
          .populate("instructorId", "name email")
          .populate("enrolledStudents.user", "_id name email profileImage role")
          .lean()); // getters to include virtuals that converts the id types to string
      if (rawCourse) {
        courses = serializeCourses(rawCourse) as CCourse[]; //mapping objectId to string 
        await redisClient.set(cachedUsersCoursesKey, JSON.stringify(courses) as string, { ex: 600 }); // 10 min
      }
    }
    // const course = await Course.findById(courseId)
    //   .select("title description coverImage rating price category lessons.name lessons.duration instructor reviews")
    //   .populate("instructor", "name profileImage")
    //   .lean();

    return <ManageCoursePageComponent fetchedCourses={courses} />;

  } catch (error) {
    console.error("Error in ManagePage:", error);
    return <ManageCoursePageComponent fetchedCourses={[]} />;
  }
};

export default ManagePage;
