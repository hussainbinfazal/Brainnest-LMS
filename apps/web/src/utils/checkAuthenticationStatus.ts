import bcrypt from "bcryptjs";
import { AuthenticatedUser, Credentials } from "@/types/auth";
import { logger } from "@/utils/logger/logger.node";
import { connectDB, IUser, User } from "@repo/shared";




export async function authenticateUser(credentials: Credentials): Promise<AuthenticatedUser | null> {
  try {
    await connectDB(process.env.MONGODB_URI!);

    const user: IUser | null = await User.findOne({ email: credentials.email }).select(
      "+password"
    );
    if (!user) {
      logger.warn("No user found with this email");
      return null;
    }
    logger.info("User found", {
      user: user._id
    });


    const isValid = await bcrypt.compare(credentials.password, user.password);
    logger.info("Password valid", { valid: isValid },);

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
