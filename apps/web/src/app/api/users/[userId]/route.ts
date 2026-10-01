import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextRequest, NextResponse } from "next/server";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";

const updateUserBodySchema = z.object({
  userData: z.object({
    password: z.string().optional(),
    name: z.string().optional(),
    phoneNumber: z.string().optional(),
  }).passthrough(),
});
import { User, connectDB, IUser, logger, validateMongooseId, UserDocument } from '@repo/shared/server';  // Ensure the path is correct
import bcrypt from "bcryptjs";
import { CustomNextRequest } from "@/types/server";
 

// GET handler to fetch a user by ID from URL params
export async function GET(request: CustomNextRequest, context: { params: { id: string } }): Promise<NextResponse> {
  try {
    await connectDB(process.env.MONGODB_URI!);

    const { id } = context.params;
    if (!id) {
      logger.info("User Id is required", { id });
      return failResponse({ error: "User ID is required" }, 400, undefined, undefined, true);
    }
    if (!validateMongooseId({ userId: id })) {
      logger.info("Invalid User ID", { id });
      return failResponse({ error: "Invalid User ID" }, 400, undefined, undefined, true);
    }
    const user: IUser | null = await User.findById(id).lean();
    if (!user) {
      logger.info("User not found");
      return failResponse({ error: "User not found" }, 404, undefined, undefined, true);
    }
    logger.info("User fetched successfully", { userId: id });
    return successResponse({ user }, 200, undefined, undefined, true);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error in getting user: ${message}`);
    return failResponse({ message: `Error in getting user: ${message}` }, 500, undefined, undefined, true);
  }
}


export async function PUT(request: NextRequest, context: { params: { userId: string } }): Promise<NextResponse> {
  try {
    // console.log("Put controller called")
    await connectDB(process.env.MONGODB_URI!);
    const { userId } = await context.params;
    const user: UserDocument | null = await User.findById(userId);
    if (!user) return failResponse({ message: "User not found" }, 404, undefined, undefined, true);
    if (!userId) return failResponse({ message: "User id is required" }, 400, undefined, undefined, true);
    const body = await parseBody(request, updateUserBodySchema);
    if (!body.ok) return body.response;
    const { userData } = body.data;
    // console.log("Body", userData);
    const { password, name, phoneNumber } = userData;
    if (!userData) return failResponse({ message: "User data is required" }, 400, undefined, undefined, true);
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.name = name || user.name;
    await user.save();
    // console.log("This is the updated User in the backend:",user)
    logger.info("User Updated Successfully")
    return successResponse({ message: "User updated successfully", user }, 200, undefined, undefined, true);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return failResponse({ message: message }, 500, undefined, undefined, true);
  }
}


export async function DELETE(request: NextRequest, context: { params: { userId: string } }): Promise<NextResponse> {
  try {
    await connectDB(process.env.MONGODB_URI!);
    const { userId } = await context.params;
    if (!userId) return failResponse({ message: "User id is required" }, 400, undefined, undefined, true);
    const user: IUser | null = await User.findByIdAndDelete(userId);
    return successResponse({ message: "User deleted successfully", user }, 200, undefined, undefined, true);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return failResponse({ message: `Error in deleting user:${message}` }, 500, undefined, undefined, true);
  }
}
