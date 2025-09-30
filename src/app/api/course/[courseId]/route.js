import { NextResponse } from "next/server";
import Course from "@/models/course/courseModel";
import { connectDB } from "@/config/db";
import { getDataFromToken } from "@/utils/getDataFromToken";


export async function GET(request, context) {
    await connectDB();
    try {
        const { courseId } = await context.params;

        // console.log("Fetching course by id, controller called", "this is the courseId :", courseId);
        const user = await getDataFromToken(request);
        // if (user.role !== "instructor") { return NextResponse.json({ message: "You are not authorized" }, { status: 401 }); }
        if (!courseId) {
            return NextResponse.json({ message: "Course id is required" }, { status: 400 });
        }

        const course = await Course.findById(courseId).populate("instructor").populate("reviews.user", "name profileImage")
            ;
        // console.log("This is the course", course);
        const instructorId = course?.instructor?._id.toString();
        if (!course) {
            return NextResponse.json({ message: "Course not found" }, { status: 404 });
        }

        const coursesByInstructor = await Course.find({ instructor: instructorId });

        // Get total enrolled students and reviews
        let totalEnrolled = 0;
        let totalReviews = 0;
        let totalRatings = 0;
        coursesByInstructor.forEach(course => {
            totalEnrolled += course.enrolledStudents.length;
            totalReviews += course.reviews.length;
            totalRatings += course.reviews.reduce((acc, review) => acc + review.rating, 0);
        });
        return NextResponse.json({ course, coursesByInstructor, totalEnrolled, totalReviews, totalRatings }, { status: 200 });
    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: "Something went wrong on the server side" }, { status: 500 });
    }
}