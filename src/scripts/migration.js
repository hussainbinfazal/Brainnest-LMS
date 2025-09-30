import mongoose from "mongoose";
import connectDB from "../config/db"; // adjust path if needed
import Course from "../models/course/courseModel";
import Enrollment from "../models/course/enrollmentModel";

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

  console.log("Migration completed!");
  process.exit();
}

migrateEnrollments();
