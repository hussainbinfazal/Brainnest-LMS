import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User/userModel";  // Ensure the path is correct
import { connectDB } from "@/config/mongoDB/db";
import bcrypt from "bcryptjs";
import { IUser } from "@/types/model";

// GET handler to fetch a user by ID from URL params
export async function GET(request: NextRequest, context: { params: { id: string } }): Promise<NextResponse> {
  try {
    await connectDB();
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    const user: IUser | null = await User.findById(id).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error: any) {
    // Handle any potential errors
    console.error(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: `Error in getting user: ${message}` }, { status: 500 });
  }
}


export async function PUT(request: NextRequest, context: { params: { userId: string } }): Promise<NextResponse> {
  try {
    // console.log("Put controller called")
    await connectDB();
    const { userId } = await context.params;
    const user: IUser | null = await User.findById(userId);
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });
    if (!userId) return NextResponse.json({ message: "User id is required" }, { status: 400 });
    const { userData } = await request.json();
    // console.log("Body", userData);
    const { password, name, phoneNumber } = userData;
    if (!userData) return NextResponse.json({ message: "User data is required" }, { status: 400 });
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.name = name || user.name;
    await user.save();
    // console.log("This is the updated User in the backend:",user)

    return NextResponse.json({ message: "User updated successfully", user }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: message }, { status: 500 });
  }
}


export async function DELETE(request: NextRequest, context: { params: { userId: string } }): Promise<NextResponse> {
  try {
    await connectDB();
    const { userId } = await context.params;
    if (!userId) return NextResponse.json({ message: "User id is required" }, { status: 400 });
    const user: IUser | null = await User.findByIdAndDelete(userId);
    return NextResponse.json({ message: "User deleted successfully", user }, { status: 200 });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: `Error in deleting user:${message}` }, { status: 500 });
  }
}
