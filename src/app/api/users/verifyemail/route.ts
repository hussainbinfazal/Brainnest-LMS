import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User/userModel";
import { connectDB } from "@/config/mongoDB/db";
import { IUser } from "@/types/model";
import { logger } from "@/utils/logger/logger.node";



export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();
        const { token } = await request.json();
        logger.debug({ token }, "verifyemail token received");
        const user: IUser | null = await User.findOne({ resetPasswordToken: token, resetPasswordTokenExpires: { $gt: Date.now() } });
        if (!user) {
            return NextResponse.json({ message: "no user found with this token" }, { status: 400 });
        }

        user.resetPasswordToken = null;
        user.resetPasswordTokenExpire = null;
        await user.save();
        return NextResponse.json({
            message: "Email verified successfully",
            success: true
        }, { status: 200 });

    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(error, "Error verifying email");
        return NextResponse.json({ message: `Error in verifying email: ${message}` }, { status: 500 });
    }
}