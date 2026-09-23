import { NextRequest, NextResponse } from "next/server";
import { ATTEMPT_EMAIL, EMAIL_OTP_LOCK, ISessionUser, MAX_ATTEMPTS, User, UserToken, validateEmail } from "@repo/shared";
import { connectDB } from "@repo/shared";
import { logger } from "@/utils/logger/logger.node";
import { CustomNextRequest } from "@/types/server";
import crypto from "crypto";
import { Session } from "next-auth";
import { auth } from "@/auth";
import mongoose from "mongoose";
import { CACHE_TTL, getCached, incrementWithTtl, invalidateCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import z from "zod";


const VerifyEmailbodySchema: z.ZodType<{ email: string; otp: string }> = z.object({
    email: z.string().email(),
    otp: z.string().trim().toLowerCase().email(),
})
///on first registration, there will be no email and user id 
export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    const body = await request.json().catch(() => null);
    const parsed = VerifyEmailbodySchema.safeParse(body);
    if (!parsed.success) {
        logger.info("Invalid Payload", { ip: request.ip });
        return NextResponse.json({ message: "Invalid Payload" }, { status: 400 });
    };
    const { email, otp } = parsed.data;
    if (!email || !validateEmail(email)) {
        return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    };
    const stored = await getCached(OTP_NS, email);
    if (!otp)
        return NextResponse.json({ message: "Otp is required" }, { status: 401 });
    const isCachedLock = await getCached(EMAIL_OTP_LOCK.namespace, email);
    if (isCachedLock) {
        logger.info("Too many attempts, please try again later", { ip: request.ip });
        return NextResponse.json({ message: "Too many attempts, please try again later" }, { status: 429 });
    };

    const attempts = await incrementWithTtl(ATTEMPT_EMAIL.namespace, email, CACHE_TTL.MEDIUM, 1);


    await connectDB(process.env.MONGODB_URI!);

    //Hash OTP
    const hashedEmailOtp: string = crypto
        .createHash("sha256")
        .update(otp.trim())
        .digest("hex");


    //Find token and update atomically at the same time
    const tokenDoc = await UserToken.findOneAndUpdate(
        {
            userId: user.id,
            type: "email-verification",
            attempts: { $lt: MAX_ATTEMPTS },
            expiresAt: { $gt: new Date() },
        },
        {
            $inc: {
                attempts: 1,
            },
        },
        { new: true }
    ).exec();

    //If token not found, check if user has too many attempts, if so, return 429
    if (!tokenDoc) { //does a live token exist at all
        const stillExists = await UserToken.exists({
            userId: user.id,
            type: "email-verification",
            expiresAt: { $gt: new Date() },
        }).exec();
        // set the lock now so every subsequent brute-force request short-circuits above.
        await setCached(EMAIL_OTP_LOCK.namespace, user.id, true, CACHE_TTL.MEDIUM);
        const message = stillExists
            ? "Too many attempts. Request a new OTP."
            : "OTP expired or not found";
        logger.info("Invalid or expired OTP", { message });
        return NextResponse.json(
            { message: "Invalid or expired OTP" },
            { status: stillExists ? 429 : 400 }
        );
    };
    ///Verify token and user entered OTP
    if (tokenDoc.token !== hashedEmailOtp) {
        logger.info("Invalid or expired OTP", { tokenDoc });
        return NextResponse.json(
            {
                message: `Invalid OTP. ${MAX_ATTEMPTS - tokenDoc.attempts} attempt(s) left.`,
            },
            { status: 400 }
        );
    }
    const session: mongoose.ClientSession = await mongoose.startSession();
    try {
        //Mark user verified and delete token 
        await session.withTransaction(async () => {
            await UserToken.deleteOne({ _id: tokenDoc._id }, { session }).exec();
            await User.updateOne(
                { _id: user.id, isVerified: false },
                { $set: { isVerified: true } },
                { session }
            ).exec();
        });


        //Update and delete the cached lock, when user verifies email or resend email attempted
        await invalidateCached(EMAIL_OTP_LOCK.namespace, user.id);

        return NextResponse.json(
            {
                message: "Email verified successfully",
                success: true,
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logger.error("Email verification error:", { message });
        return NextResponse.json(
            { message: `Error in verifying email ` },
            { status: 500 }
        );
    } finally {
        await session.endSession();
    }
}
