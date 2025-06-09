import { connectDB } from "@/config/db";
import { NextResponse, NextRequest } from "next/server";
import User from "@/models/userModel";
import bcrypt from "bcryptjs";
import { generateToken } from "@/utils/generateToken";
import { cookies } from "next/headers";
export async function POST(request) {
    await connectDB();
    try {
        const { email, password, fromOAuth } = await request.json();
        // console.log("Received Email and Password", email, password);
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 400 });
        }
        if (fromOAuth) {
            const token = generateToken(user._id, user.role);
            console.log("Generated Token", token);
            const response = NextResponse.json({
                message: "User logged in successfully",
                user,
                token
            });

            response.cookies.set({
                name: 'token',
                value: token,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60,
                path: '/',
            });

            return response;

        }
        // console.log("User found", user);
        // console.log("User password", user.password, "Password", password);
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        // console.log("isPasswordCorrect", isPasswordCorrect);
        if (!isPasswordCorrect) {
            return NextResponse.json({ message: "Username or password is incorrect" }, { status: 401 });
        }
        const token = generateToken(user._id, user.role);

        const response = NextResponse.json({
            message: fromOAuth ? "User logged in successfully" : "Welcome Back",
            user,
            token
        }, { status: 200 });

        // Set the cookie on the response object
        response.cookies.set({
            name: 'token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Only secure in production
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
            path: '/',
        });

        return response;
    } catch (error) {
        console.log(error);
    }
}