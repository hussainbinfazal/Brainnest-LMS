import { bloomMightContain } from "@/lib/bloomFilter/bloomFilter";
import { CustomNextRequest } from "@/types/server";
import { connectDB, IUser, logger, User } from "@repo/shared";
import mongoose, { Types } from "mongoose";
import { NextResponse } from "next/server";

export async function GET(request: CustomNextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get("username")?.trim();
        if (!username || username.length < 3) {
            return NextResponse.json({ message: "too_short", available: false }, { status: 400 });

        };
        //Bloom check
        const mightExist: boolean = await bloomMightContain(username);
        if (!mightExist) {
            return NextResponse.json({ message: "Username is available", available: true }, { status: 200 });
        };
        //final Source of truth(DB)
        await connectDB(process.env.MONGODB_URI!);
        const exists: { _id: Types.ObjectId } | null = await User.exists({ userName: username });
        return NextResponse.json({ available: !exists }, { status: 200 });
    } catch (error: unknown) {
        const message: string = error instanceof Error ? error.message : "Unknown error";
        logger.error(
            "Error in checking username:",
            { message }
        );
        return NextResponse.json({ message, available: false }, { status: 500 });
    }
}