import bcrypt from "bcryptjs";
import User from "../models/userModel";
import { connectDB } from "@/config/db";
import { AuthenticatedUser, Credentials } from "@/types/auth";




export async function authenticateUser(credentials: Credentials): Promise<AuthenticatedUser | null> {
  try {
    await connectDB();

    const user = await (User).findOne({ email: credentials.email }).select(
      "+password"
    );
    console.log("User found:", !!user);
    
    if (!user) {
      console.log("No user found with email:", credentials.email);
      return null;
    }

    const isValid = await bcrypt.compare(credentials.password, user.password);
    console.log("Password valid:", isValid);
    
    if (!isValid) return null;

    return {
      id: typeof user._id === "string" ? user._id : String(user._id),
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profileImage,
      
    };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}
