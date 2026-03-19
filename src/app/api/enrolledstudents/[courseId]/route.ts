// import { NextRequest, NextResponse } from 'next/server';
// import { connectDB } from "@/config/mongoDB/db";
// import Course from "@/models/Course/courseModel";
// import User from "@/models/User/userModel";
// import { getDataFromToken } from "@/utils/getDataFromToken";
// import { IUser } from '@/types/model';
// import mongoose from 'mongoose';
// import { ISessionUser } from '@/types/server';
// import { logger } from "@/utils/logger/logger";


// export async function PUT(request: NextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
//     await connectDB();
//     try {
//         const { courseId } = context.params;
//         const user: ISessionUser | null = await getDataFromToken(request);
//         if (!user || !user.id) {
//             logger.info("Unauthorized access");
//             return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
//         }
//         // logger.debug("This is the course Id ", { courseId });
//         if(!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(user.id)){ return NextResponse.json({ message: "Invalid course id or user id" }, { status: 400 })}
//         const course = await Course.findById(courseId);
//         const userId: string | null = user?.id || "";
//         // logger.debug("This is the course", { course });
//         // logger.debug("This is the user", { user });
//         const userInDb: IUser | null = await User.findById(userId);

//         // logger.debug("This is the userId", { userId });
//         if (!userId) return NextResponse.json({ message: "User id is required" }, { status: 400 });
//         if (!course) return NextResponse.json({ message: "Course not found" }, { status: 400 });
//         const userObjectId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(userId);
//         const courseObjectId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(courseId);
//         if (course.enrolledStudents.includes({
//             user: userObjectId,
//         })) return NextResponse.json({ message: "userId is already in included in the course " }, { status: 400 });
//         // if (userInDb.enrolledCourses.includes(courseId)) return NextResponse.json({ message: "courseId is already present in this enrolled user" }, { status: 400 });
//         course.enrolledStudents.push({
//             user: userObjectId,
//             enrolledAt: new Date(),
//         });
//         userInDb?.enrolledCourses.push(courseObjectId);
//         await userInDb?.save();
//         await course.save();
//         return NextResponse.json({ enrolledStudents: course.enrolledStudents, enrolledCourses: userInDb?.enrolledCourses }, { status: 200 });

//     } catch (error: any) {
//         logger.error(error);
//         const message = error instanceof Error ? error.message : 'Unknown error';
//         return NextResponse.json({ message: `Error adding new enrolled student: ${message}` }, { status: 500 })
//     }
// }
// move this logic to after payment 
