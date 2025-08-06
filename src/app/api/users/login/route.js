import { connectDB } from "@/config/db";
import { NextResponse, NextRequest } from "next/server";
import User from "@/models/userModel";
import bcrypt from "bcryptjs";
export async function POST(request) {
    await connectDB();
    try {
        const { email, password, fromOAuth } = await request.json();
        // console.log("Received Email and Password", email, password);
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 400 });
        }
        
        
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        // console.log("isPasswordCorrect", isPasswordCorrect);
        if (!isPasswordCorrect) {
            return NextResponse.json({ message: "Username or password is incorrect" }, { status: 401 });
        }

        const response = NextResponse.json({
            message: fromOAuth ? "User logged in successfully" : "Welcome Back",
            user,
            token
        }, { status: 200 });

        // Set the cookie on the response object
       

        return response;
    } catch (error) {
        console.log(error);
    }
}