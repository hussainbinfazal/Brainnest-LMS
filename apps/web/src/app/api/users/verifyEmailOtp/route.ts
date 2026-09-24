import { NextRequest, NextResponse } from "next/server";
import { ATTEMPT_EMAIL_VERIFICATION, COOLDOWN_VERIFICATION_EMAIL, EMAIL_OTP_LOCK, getRedisClient, MAX_ATTEMPTS, OTP_VERIFICATION_EMAIL, User, USER_VERIFIED_FLAG, validateEmail } from "@repo/shared";
import { connectDB } from "@repo/shared";
import { logger } from "@/utils/logger/logger.node";
import { CustomNextRequest } from "@/types/server";
import { timingSafeEqual } from "crypto";
import { CACHE_TTL, getCached, incrementWithTtl, invalidateCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import z from "zod";
import { hashOtp } from "@/lib/OtpValidators";
import { OTP_VERIFY_EMAIL_IP_KEY } from "@repo/shared/config/redisConfig/redisRateLimitKeys";
import { checkIp } from "@/lib/helpers/rate-LimitIP";


const VerifyEmailbodySchema: z.ZodType<{ email: string; otp: string }> = z.object({
    email: z.string().email().max(254).refine(validateEmail),
    otp: z.string().regex(/^\d{6}$/),
})
///on first registration, there will be no email and user id 
export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    const { allowed, remaining, retryAfterSec, ip } = await checkIp(request, OTP_VERIFY_EMAIL_IP_KEY.namespace, OTP_VERIFY_EMAIL_IP_KEY.id, OTP_VERIFY_EMAIL_IP_KEY.max, OTP_VERIFY_EMAIL_IP_KEY.windowSec);
    if (!allowed) {
        return NextResponse.json(
            { message: 'Too many requests, please try again later' },
            { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
        );
    }

    const body = await request.json().catch(() => null);
    const parsed = VerifyEmailbodySchema.safeParse(body);
    if (!parsed.success) {
        logger.info("Invalid Payload", { ip });
        return NextResponse.json({ message: "Invalid Payload" }, { status: 400 });
    };
    const { email, otp } = parsed.data;
    if (!email || !validateEmail(email)) {
        return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    };
    const stored = await getCached<string>(OTP_VERIFICATION_EMAIL.namespace, email);
    if (!stored) {
        logger.info("Otp is expired", { ip });
        return NextResponse.json({ message: "Otp is expired" }, { status: 400 });
    };
    const isCachedLock = await getCached(EMAIL_OTP_LOCK.namespace, email);
    if (isCachedLock) {
        logger.info("Too many attempts, please try again later", { ip: ip });
        return NextResponse.json({ message: "Too many attempts, please try again later" }, { status: 429 });
    };

    try {
        const attempts = await incrementWithTtl(ATTEMPT_EMAIL_VERIFICATION.namespace, email, CACHE_TTL.MEDIUM, 1);

        if (attempts > MAX_ATTEMPTS) {
            logger.info("Too many attempts, please try again later", { ip: ip });
            invalidateCached(EMAIL_OTP_LOCK.namespace, email); //Remove redis lock for future request for this email;
            setCached(EMAIL_OTP_LOCK.namespace, email, true, CACHE_TTL.MEDIUM);
            return NextResponse.json({ message: "Too many attempts. Request a new OTP." }, { status: 429 });
        };
        //hex to buffer for fater comparisons
        const expected = Buffer.from(stored, "hex");
        const actual = Buffer.from(hashOtp(email, otp), "hex");

        const match = expected.length === actual.length && timingSafeEqual(expected, actual) //Creating buffers because hashing and comparing buffers is faster than hashing and comparing strings, timingSafeEqual makes both buffers equal length, so timingSafeEqual can't throw error

        if (!match) {
            return NextResponse.json({ message: `Invalid OTP. You have ${MAX_ATTEMPTS - attempts} attempts left.` }, { status: 401 });
        }
        await connectDB(process.env.MONGODB_URI!);


        //Mark user verified and delete token 
        // await UserToken.deleteOne({ _id: tokenDoc._id }, { session }).exec();
        let result = await User.updateOne(
            { email: email, isVerified: false },
            { $set: { isVerified: true } },
            {}
        ).exec();
        if (result.matchedCount === 0) {
            logger.info("User not found", { email });
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }



        //Update and delete the cached lock, when user verifies email or resend email attempted
        await Promise.allSettled([
            invalidateCached(ATTEMPT_EMAIL_VERIFICATION.namespace, email), //Remove redis lock for future request for this email;
            invalidateCached(OTP_VERIFICATION_EMAIL.namespace, email),
            invalidateCached(EMAIL_OTP_LOCK.namespace, email),//remove lock for future request
            setCached(USER_VERIFIED_FLAG.namespace, email, "1", 15 * 60) ///use this flag while new user registration
        ]);
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
            { message: `Error in verifying email` },
            { status: 500 }
        );
    }
}
