import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { bloomMightContain } from "@/lib/bloomFilter/bloomFilter";
import { recordBloomCheck } from "@/lib/bloomFilter/bloomStats";
import { CustomNextRequest } from "@/types/server";
import { connectDB, IUser, logger, User } from '@repo/shared/server';
import mongoose, { Types } from "mongoose";
import { NextResponse } from "next/server";

export async function GET(request: CustomNextRequest) {
    try {
        console.log("readyState at route entry:", mongoose.connection.readyState, "cached.conn:", !!global.mongooseCache?.conn);
        const { searchParams } = new URL(request.url);
        const username = searchParams.get("username")?.trim();
        if (!username || username.length < 3) {
            return failResponse({ message: "too_short", available: false }, 400, undefined, undefined, true);

        };
        //Bloom check
        const mightExist: boolean = await bloomMightContain(username);
        recordBloomCheck(mightExist); //fire and forget
        if (!mightExist) {
            return successResponse({ message: "Username is available", available: true }, 200, undefined, undefined, true);
        };
        //final Source of truth(DB)
        await connectDB(process.env.MONGODB_URI!);
        const exists: { _id: Types.ObjectId } | null = await User.exists({ userName: username });
        return successResponse({ available: !exists }, 200, undefined, undefined, true);
    } catch (error: unknown) {
        const message: string = error instanceof Error ? error.message : "Unknown error";
        logger.error(
            "Error in checking username:",
            { error, message }
        );
        return failResponse({ message, available: false }, 500, undefined, undefined, true);
    }
}