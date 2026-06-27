import { NextRequest, NextResponse } from "next/server";
import { getDataFromToken, ISessionUser, IUserToken, User, UserToken } from "@repo/shared";
import { connectDB } from "@repo/shared";

import { logger } from "@repo/shared";
import { CustomNextRequest } from "@/types/server";
import crypto from "crypto";
import mongoose from "mongoose";
import { sendEmail } from "@/lib/helpers/mailer";



export async function POST(request: CustomNextRequest): Promise<NextResponse> {

    await connectDB(process.env.MONGODB_URI!);
    const session = await mongoose.startSession();
    try {
        const { email } = await request.json();
        const existingUser = await User.findOne({ email }).select("_id email").exec();
        // const { userId } = await request.json();
        if (!existingUser) {
            logger.info("User not found");
            return NextResponse.json({ message: "If an account exists, a reset link has been sent to your email" }, { status: 200 })
        };
        session.startTransaction();
        await UserToken.deleteMany({
            userId: existingUser._id,
            type: "reset"
        }).session(session).exec();
        const resetToken: string = crypto.randomBytes(32).toString("hex");
        const hashedToken: string = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");
        const newToken = new UserToken({
            userId: existingUser._id,
            token: hashedToken,
            type: "reset",
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            isUsed: false,
        });

        await newToken.save({ session });
        await session.commitTransaction();

        const mailResponse = await sendEmail(email, "RESET", existingUser._id.toString(), resetToken);

        logger.info("Email sent successfully to " + email, { mailResponse });

        logger.info("Password reset token generated", {
            userId: existingUser._id,
        });

        return NextResponse.json({ message: "If an account exists, a reset link has been sent to your email" }, { status: 200 });
    } catch (error: unknown) {
        await session.abortTransaction();
        const message: string = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Something went wrong:", { message });
        return NextResponse.json({ message }, { status: 500 });
    } finally {
        await session.endSession();
    }
}