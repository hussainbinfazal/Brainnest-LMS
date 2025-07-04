import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import User from "@/models/userModel";
import { generateToken } from "@/utils/generateToken";
import { cookies } from "next/headers";

export async function PUT(request, context) {
    await connectDB();
    try {
        const { userId } = await context.params;;
        if (!userId) {
            return NextResponse.json({ message: "User id is required" }, { status: 400 });
        }
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ message: "No user und with this id" }, { status: 400 });
        }
        user.role = "instructor" || user.role;
        const token = generateToken(user._id, user.role);
        await cookies().set({
            name: 'token',
            value: token,
            httpOnly: true,
            sameSite: 'strict',
            //   secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
            path: '/',
        });
        await user.save();
        return NextResponse.json({ message: "User updated successfully", user, token }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}