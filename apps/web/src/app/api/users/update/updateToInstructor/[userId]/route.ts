// import { NextRequest, NextResponse } from "next/server";
// import { connectDB } from "@/config/mongoDB/db";
// import User from "@/models/User/userModel";
// import { cookies } from "next/headers";
// import { IUser } from "@/types/model";

// export async function PUT(context: { params: { userId: string } }) {
//     await connectDB();
//     try {
//         const { userId } = await context.params;;
//         if (!userId) {
//             return NextResponse.json({ message: "User id is required" }, { status: 400 });
//         }
//         const user: IUser | null = await User.findById(userId);
//         if (!user) {
//             return NextResponse.json({ message: "No user und with this id" }, { status: 400 });
//         }
//         user.role = user.role !== "instructor" ? "instructor" : user.role;

//         await user.save();
//         return NextResponse.json({ message: "User updated successfully", user }, { status: 200 });
//     } catch (error: any) {
//         const message = error instanceof Error ? error.message : 'Unknown error';
//         return NextResponse.json({ message: `Error in updating user : ${message}` }, { status: 500 });
//     }
// }