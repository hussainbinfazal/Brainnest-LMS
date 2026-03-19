import { connectDB } from "@/config/mongoDB/db";
import User from "@/models/User/userModel";
import UserCourse from "@/models/User/userCourse";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { ISessionUser } from "@/types/server";
import { IUser } from "@/types/model";
export async function GET(request: NextRequest): Promise<NextResponse> {
  await connectDB();
  try {
    const meUser: ISessionUser | null = await getDataFromToken(request);

    if (!meUser?.id) return NextResponse.json({ message: "Missing User Details" }, { status: 401 });

    // Get user basic info
    const userDB: IUser | null = await User.findById(meUser?.id)
      .select('-password')
      .lean();

    if (!userDB) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // Get user's course relationships from UserCourse
    const userCourses = await UserCourse.find({ userId: meUser?.id })
      .populate('courseId', 'title _id instructor price rating reviews coverImage category')
      .lean();

    // Separate courses by type
    const likedCourses = userCourses
      .filter(uc => uc.isLiked)
      .map(uc => uc.courseId);

    const enrolledCourses = userCourses
      .filter(uc => uc.isEnrolled)
      .map(uc => uc.courseId);

    const completedCourses = userCourses
      .filter(uc => uc.isCompleted)
      .map(uc => uc.courseId);

    const responseUser = {
      ...userDB,
      likedCourses,
      enrolledCourses,
      completedCourses
    };

    return NextResponse.json({ user: responseUser, message: "User fetched successfully" }, { status: 200 });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: `Error in getting user: ${message}` }, { status: 500 });
  }


}
