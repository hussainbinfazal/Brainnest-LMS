import { NextResponse } from "next/server";
import User from "@/models/userModel";
import { connectDB } from "@/config/db";
import { generateToken } from "@/utils/generateToken";

export async function POST(request) {
    await connectDB();
    try {
        const { name, email, password, profileImage, phoneNumber } = await request.json();
        const user = await User.findOne({ email });
        if (user) {
            return NextResponse.json({ message: "User already exists" }, { status: 400 });
        }

        const newUser = new User({ name, email, password, profileImage, phoneNumber });
        await newUser.save();
        const token = generateToken(newUser._id, newUser.role);
        return NextResponse.json({ message: "User created successfully", newUser,token }, { status: 201 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Error creating user" }, { status: 500 });
    }
}