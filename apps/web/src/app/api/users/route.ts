import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextRequest, NextResponse } from "next/server";
import { checkIp, ISessionUser, IUserToken, User, UserToken, USER_PASSWORD_RESET_IP_KEY } from '@repo/shared/server';
import { connectDB } from '@repo/shared/server';

import { logger } from '@repo/shared/server';
import { CustomNextRequest } from "@/types/server";
import crypto from "crypto";
import mongoose from "mongoose";
import { sendEmail } from "@/lib/helpers/mailer";
import { Session } from "next-auth";
import { auth } from "@/auth";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";

const resetPasswordBodySchema = z.object({ email: z.string().email() });

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, USER_PASSWORD_RESET_IP_KEY.namespace, USER_PASSWORD_RESET_IP_KEY.max, USER_PASSWORD_RESET_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);

    await connectDB(process.env.MONGODB_URI!);
    const session = await mongoose.startSession();
    try {
        const body = await parseBody(request, resetPasswordBodySchema);
        if (!body.ok) return body.response;
        const { email } = body.data;
        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const sessionUser: ISessionUser | null = authSession?.user;
        const existingUser = await User.findOne({ email }).select("_id email").exec();
        // const { userId } = await request.json();
        if (!existingUser) {
            logger.info("User not found");
            return successResponse({ message: "If an account exists, a reset link has been sent to your email" }, 200, undefined, undefined, true)
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

        return successResponse({ message: "If an account exists, a reset link has been sent to your email" }, 200, undefined, undefined, true);
    } catch (error: unknown) {
        await session.abortTransaction();
        const message: string = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Something went wrong:", { message });
        return failResponse({ message }, 500, undefined, undefined, true);
    } finally {
        await session.endSession();
    }
}