import { NextResponse } from "next/server";
import User from "@/models/userModel";
import { connectDB } from "@/config/db";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
export async function POST(request) {
    await connectDB();
    try {
        const { name, email, password, profileImage, phoneNumber, fromOAuth } = await request.json();
        const user = await User.findOne({ email });
        if (user) {
            return NextResponse.json({ message: "User already exists" }, { status: 400 });
        }
        if (fromOAuth) {
            const newUser = new User({ name, email, password, profileImage, phoneNumber });
            await newUser.save();

            console.log("Generated Token in the registerd console ", token);

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
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, profileImage, phoneNumber });
        await newUser.save();
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
        return NextResponse.json({ message: "User created successfully", newUser, token }, { status: 201 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Error creating user" }, { status: 500 });
    }
}