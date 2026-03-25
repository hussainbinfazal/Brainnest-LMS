import mongoose from "mongoose";
import connectDB from "../config/mongoDB/db"; // adjust path if needed
import Course from "../models/Course/courseModel";
import Enrollment from "../models/Course/enrollmentModel";
import { logger } from "@/utils/logger/logger";

async function migrateEnrollments() {
  await connectDB();

  const courses = await Course.find({});

  for (const course of courses) {
    if (course.enrolledStudents && course.enrolledStudents.length > 0) {
      for (const student of course.enrolledStudents) {
        const exists = await Enrollment.exists({ course: course._id, user: student.user });
        if (!exists) {
          await Enrollment.create({
            course: course._id,
            user: student.user,
            enrolledAt: student.enrolledAt || new Date(),
          });
        }
      }
    }
  }

  logger.info("Migration completed!");
  process.exit();
}

migrateEnrollments();
