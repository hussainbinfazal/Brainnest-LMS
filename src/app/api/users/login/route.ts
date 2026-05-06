import { connectDB } from "@/config/mongoDB/db";
import { NextResponse, NextRequest } from "next/server";
import User from "@/models/User/userModel";
import bcrypt from "bcryptjs";
import { IUser } from "@/types/model";
import { logger } from "@/utils/logger/logger.node";
export async function POST(request: NextRequest): Promise<NextResponse> {
    await connectDB();
    try {
        const { email, password, fromOAuth } = await request.json();
        const user: IUser | null = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 400 });
        }
        const isPasswordCorrect: boolean | null = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return NextResponse.json({ message: "Username or password is incorrect" }, { status: 401 });
        }

        return NextResponse.json({
            message: fromOAuth ? "User logged in successfully" : "Welcome Back",
            user,
        }, { status: 200 });

        // Set the cookie on the response object

    } catch (error: any) {
        logger.error(error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `Error in login: ${message}` }, { status: 500 });
    }
}