import { NextResponse } from "next/server";
import User from "@/models/userModel";  // Ensure the path is correct
import { connectDB } from "@/config/db";
import bcrypt from "bcryptjs";

// GET handler to fetch a user by ID from URL params
export async function GET(request, context) {
  try {
    // Extract the user ID from the request params
    const { id } = await context.params;

    // Validate if the ID exists
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Fetch the user from the database
    const user = await User.findById(id).lean();

    // If the user is not found, return a 404 error
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return the user data as a response
    return NextResponse.json(user);
  } catch (error) {
    // Handle any potential errors
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


export async function PUT(request, context) {
  try {
    // console.log("Put controller called")
    await connectDB();
    const { userId } = await context.params;
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });
    if (!userId) return NextResponse.json({ message: "User id is required" }, { status: 400 });
    const {userData} = await request.json();
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

    return NextResponse.json({ message: "User updated successfully",user }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}


export async function DELETE(request, context) {
  try {
    await connectDB();
    const { userId } = await context.params;
    if (!userId) return NextResponse.json({ message: "User id is required" }, { status: 400 });
    const user = await User.findByIdAndDelete(userId);
    return NextResponse.json({ message: "User deleted successfully", user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
