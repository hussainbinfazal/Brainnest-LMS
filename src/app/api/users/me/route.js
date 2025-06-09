import { connectDB } from "@/config/db";
import User from "@/models/userModel";
import { NextResponse } from "next/server";
import { getDataFromToken } from "@/utils/getDataFromToken";
export async function GET(request) {
  await connectDB();
  try {
    const user = await getDataFromToken(request);
    console.log(user);
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 401 });
    const userDB = await User.findById(user.id || user._id).select('-password').lean();
    console.log("This is the userDB", userDB);


    return NextResponse.json({ user: userDB });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }


}
