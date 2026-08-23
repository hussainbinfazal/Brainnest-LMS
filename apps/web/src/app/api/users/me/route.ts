import { connectDB, IUser, IUserCourse, logger, User, userCourse, } from "@repo/shared";
import {  NextResponse } from "next/server";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import mongoose from "mongoose";

//Look into this 
export async function GET(request: CustomNextRequest): Promise<NextResponse> {
  await connectDB(process.env.MONGODB_URI!);
  try {
    const meUser: ISessionUser | null = await getDataFromToken(request);

    if (!meUser?.id) {
      logger.warn("Unauthorized access attempt",{ ip: request.ip });
      return NextResponse.json({ message: "Missing User Details" }, { status: 401 });
    }

    // Get user basic info
    const userDB: IUser | null = await User.findById(meUser?.id)
      .select('-password')
      .exec();

    if (!userDB) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // Get user's course relationships from UserCourse
    const userCourses:IUserCourse[] | null = await userCourse.find({ userId: meUser?.id })
      .populate('courseId', 'title _id instructor price rating reviews coverImage category')
      .lean();

    // Separate courses by type
    const likedCourses: mongoose.Types.ObjectId[] = userCourses
      .filter(uc => uc.isLiked)
      .map(uc => uc.courseId);

    const enrolledCourses: mongoose.Types.ObjectId[] = userCourses
      .filter(uc => uc.isEnrolled)
      .map(uc => uc.courseId);

    const completedCourses: mongoose.Types.ObjectId[] = userCourses
      .filter(uc => uc.isCompleted)
      .map(uc => uc.courseId);

    const responseUser = {
      ...userDB,
      likedCourses,
      enrolledCourses,
      completedCourses
    };
    logger.info("User fetched successfully", { userId: meUser?.id });
    return NextResponse.json({ user: responseUser, message: "User fetched successfully" }, { status: 200 });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error in getting user`, { error: message });
    return NextResponse.json({ message: `Error in getting` }, { status: 500 });
  }
 

}
