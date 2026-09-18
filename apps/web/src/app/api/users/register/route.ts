import { NextRequest, NextResponse } from "next/server";
import { User } from "@repo/shared";
import { connectDB } from "@repo/shared";
import bcrypt from "bcryptjs";
import { IUser } from "@repo/shared";
import { logger } from "@repo/shared";
import { HydratedDocument } from "mongoose";
export async function POST(request: NextRequest): Promise<NextResponse> {
    await connectDB(process.env.MONGODB_URI!);
    try {
        const { name, email, username, password, profileImage, phoneNumber } = await request.json();
        const user: HydratedDocument<IUser> | null = await User.findOne({ email });
        if (user) {
            logger.info("User already exists");
            return NextResponse.json({ message: "User already exists" }, { status: 400 });
        }
        const hashedPassword: string = await bcrypt.hash(password, 10);
        const newUser: HydratedDocument<IUser> = new User({ name, email, password: hashedPassword, username: username, profileImage, phoneNumber })
        await newUser.save();
        return NextResponse.json({
            message: "User created successfully", user: {
                id: newUser._id.toString(),
                name: newUser.name,
                email: newUser.email,
                username: newUser.username,
                profileImage: newUser.profileImage,
                phoneNumber: newUser.phoneNumber
            },
        }, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error creating user:", { error: message });
        return NextResponse.json({ message: `Error creating user`, }, { status: 500 });
    }
}