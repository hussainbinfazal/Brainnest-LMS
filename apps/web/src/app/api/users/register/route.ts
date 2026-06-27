// import { NextRequest, NextResponse } from "next/server";
// import {User }from "@repo/shared";
// import { connectDB } from "@repo/shared";
// import bcrypt from "bcryptjs";
// import { IUser } from "@repo/shared";
// import { logger } from "@repo/shared";
// export async function POST(request: NextRequest): Promise<NextResponse> {
//     await connectDB(process.env.MONGODB_URI!);
//     try {
//         const { name, email, password, profileImage, phoneNumber, fromOAuth } = await request.json();
//         const user: IUser | null = await User.findOne({ email });
//         if (user) {
//             return NextResponse.json({ message: "User already exists" }, { status: 400 });
//         }
//         if (fromOAuth) {
//             const newUser = new User({ name, email, password, profileImage, phoneNumber });
//             await newUser.save();
//         }
//         const hashedPassword: string = await bcrypt.hash(password, 10);
//         const newUser:IUser = new User({ name, email, password: hashedPassword, profileImage, phoneNumber });
//         return NextResponse.json({ message: "User created successfully", newUser, }, { status: 201 });
//     } catch (error: unknown) {
//         const message = error instanceof Error ? error.message : 'Unknown error';
//         logger.error("Error creating user:", { error: message });
//         return NextResponse.json({ message: `Error creating user :${message}` }, { status: 500 });
//     }
// }