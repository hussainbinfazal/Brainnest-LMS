import { NextResponse } from "next/server";
import User from "@/models/userModel";
import { connectDB } from "@/config/db";



export async function POST(request) {
    try {
        await connectDB();
        const { token } = await request.json();
        console.log("Token", token);
        const user = await User.findOne({ resetPasswordToken: token, resetPasswordTokenExpires: { $gt: Date.now() } });
        if (!user) {
            return NextResponse.json({ message: "no user found with this token" }, { status: 400 });
        }

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        return NextResponse.json({
            message: "Email verified successfully",
            success: true
        })

    } catch (error) {
        console.error("Error verifying email:", error);
        return NextResponse.json({ message: "try again after some time" }, { status: 500 });
    }
}