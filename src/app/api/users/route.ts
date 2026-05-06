import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User/userModel";
import { connectDB } from "@/config/mongoDB/db";
import { IUser } from "@/types/model";
import { logger } from "@/utils/logger/logger.node";

export async function POST(request: NextRequest): Promise<NextResponse> {
    await connectDB();
    try {
        const { name, email, password, profileImage, phoneNumber } = await request.json();
        const user: IUser | null = await User.findOne({ email });
        if (user) {
            return NextResponse.json({ message: "User already exists" }, { status: 400 });
        }

        const newUser: IUser | null = new User({ name, email, password, profileImage, phoneNumber });
        await newUser.save();
        return NextResponse.json({ message: "User created successfully", newUser }, { status: 201 });
    } catch (error: any) {
        logger.error(error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `Error creating user: ${message}` }, { status: 500 });
    }
}