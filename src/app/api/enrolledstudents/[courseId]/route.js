import { NextResponse } from 'next/server';
import { connectDB } from "@/config/db";
import Course from "@/models/courseModel";
import User from "@/models/userModel";
import { getDataFromToken } from "@/utils/getDataFromToken";


export async function PUT(request, context) {
    await connectDB();
    try {
        const { courseId } = await context.params;
        // console.log("This is the course Id ", courseId);
        const course = await Course.findById(courseId);
        // console.log("This is the course", course);
        const user = await getDataFromToken(request);
        // console.log("This is the user", user);
        const userId = user._id || user.id;
        const userInDb = await User.findById(userId);

        // console.log("This is the userId", userId);
        if (!userId) return NextResponse.json({ message: "User id is required" }, { status: 400 });
        if (!course) return NextResponse.json({ message: "Course not found" }, { status: 400 });
        if (course.enrolledStudents.includes(userId)) return NextResponse.json({ message: "userId is already in included in the course " }, { status: 400 });
        // if (userInDb.enrolledCourses.includes(courseId)) return NextResponse.json({ message: "courseId is already present in this enrolled user" }, { status: 400 });
        course.enrolledStudents.push(userId);
        userInDb.enrolledCourses.push(courseId);
        await userInDb.save();
        await course.save();
        return NextResponse.json(course.enrolledStudents, user.enrolledCourses, { status: 200 });

    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "There is a error on the server side" }, { status: 500 })
    }
}
