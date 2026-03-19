import bcrypt from "bcryptjs";
import User from "../models/User/userModel";
import { connectDB } from "@/config/mongoDB/db";
import { AuthenticatedUser, Credentials } from "@/types/auth";
import { logger } from "@/utils/logger/logger";




export async function authenticateUser(credentials: Credentials): Promise<AuthenticatedUser | null> {
  try {
    await connectDB();

    const user = await (User).findOne({ email: credentials.email }).select(
      "+password"
    );
    logger.info({ found: !!user }, "User found");

    if (!user) {
      logger.warn("No user found with this email");
      return null;
    }

    const isValid = await bcrypt.compare(credentials.password, user.password);
    logger.info({ valid: isValid }, "Password valid");

    if (!isValid) return null;

    return {
      id: typeof user._id === "string" ? user._id : String(user._id),
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profileImage,

    };
  } catch (error: any) {
    logger.error("Auth error:", error);
    return null;
  }
}
