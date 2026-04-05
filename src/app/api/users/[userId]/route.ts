import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User/userModel";  // Ensure the path is correct
import { connectDB } from "@/config/mongoDB/db";
import bcrypt from "bcryptjs";
import { IUser } from "@/types/model";
import { logger } from "@/utils/logger/logger";
import { CustomNextRequest } from "@/types/server";
import { validateMongooseId } from "@/utils/schemaValidation/idValidator/idValidator";

// GET handler to fetch a user by ID from URL params
export async function GET(request: CustomNextRequest, context: { params: { id: string } }): Promise<NextResponse> {
  try {
    await connectDB();

    const { id } = context.params;
    if (!id) {
      logger.info("User Id is required", { id });
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    if (!validateMongooseId({ userId: id })) {
      logger.info("Invalid User ID", { id });
      return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
    }
    const user: IUser | null = await User.findById(id).lean();
    if (!user) {
      logger.info("User not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    logger.info("User fetched successfully", { userId: id });
    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error in getting user: ${message}`);
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
    logger.info("User Updated Successfully")
    return NextResponse.json({ message: "User updated successfully", user }, { status: 200 });
  } catch (error: any) {
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
