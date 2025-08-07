import { connectDB } from "@/config/db";
import User from "@/models/userModel";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
export async function GET(request) {
  await connectDB();
  try {
    const session = await auth();
    console.log("Session:", session);
    if (!session?.user) return NextResponse.json({ message: "User not found" }, { status: 401 });
    // First get user without populate to see raw ObjectIds
    const userRaw = await User.findById(session.user.id).select('enrolledCourses completedCourses').lean();
    console.log("Raw enrolled courses:", userRaw.enrolledCourses);
    console.log("Raw completed courses:", userRaw.completedCourses);

    const userDB = await User.findById(session.user.id)
      .select('-password')
      .populate('likedCourses', 'title _id instructor price rating reviews coverImage category')
      .populate('enrolledCourses', 'title _id instructor price rating reviews coverImage category instructor')
      .populate('completedCourses', 'title _id instructor price rating reviews coverImage category')
      .lean();
    console.log("This is the userDB", userDB);


    return NextResponse.json({ user: userDB });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }


}
