import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextRequest, NextResponse } from "next/server";
import { ATTEMPT_EMAIL_VERIFICATION, checkIp, COOLDOWN_VERIFICATION_EMAIL, EMAIL_OTP_LOCK, getRedisClient, MAX_ATTEMPTS, OTP_VERIFICATION_EMAIL, User, USER_VERIFIED_FLAG, validateEmail } from '@repo/shared/server';
import { getErrorMessage } from "@repo/shared"
import { connectDB } from '@repo/shared/server';
import { logger } from "@repo/shared/server";
import { CustomNextRequest } from "@/types/server";
import { timingSafeEqual } from "crypto";
import { CACHE_TTL, getCached, incrementWithTtl, invalidateCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import { hashOtp } from "@/lib/OtpValidators";
import { OTP_VERIFY_EMAIL_IP_KEY } from "@repo/shared/config/redisConfig/redisRateLimitKeys";
import { verifyEmailBodySchema } from "@repo/shared/server";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";




///on first registration, there will be no email and user id 
export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    const { allowed, remaining, retryAfterSec, ip } = await checkIp(request, OTP_VERIFY_EMAIL_IP_KEY.namespace, OTP_VERIFY_EMAIL_IP_KEY.max, OTP_VERIFY_EMAIL_IP_KEY.windowSec);
    if (!allowed) {
        return failResponse({ message: `Too many requests, please try again later after ${retryAfterSec}` }, 429, undefined, { 'Retry-After': String(retryAfterSec) }, true);
    }

    const body = await parseBody(request, verifyEmailBodySchema);
    if (!body.ok) {
        logger.info("Invalid Payload", { ip });
        return body.response;
    };
    const { email, otp } = body.data;
    const stored = await getCached<string>(OTP_VERIFICATION_EMAIL.namespace, email);
    if (!stored) {
        logger.info("Otp is expired", { ip });
        return failResponse({ message: "Otp is expired" }, 400, undefined, undefined, true);
    };
    const isCachedLock = await getCached(EMAIL_OTP_LOCK.namespace, email);
    if (isCachedLock) {
        logger.info("Too many attempts, please try again later", { ip: ip });
        return failResponse({ message: "Too many attempts, please try again later" }, 429, undefined, undefined, true);
    };

    try {
        const attempts = await incrementWithTtl(ATTEMPT_EMAIL_VERIFICATION.namespace, email, CACHE_TTL.MEDIUM, 1);

        if (attempts > MAX_ATTEMPTS) {
            logger.info("Too many attempts, please try again later", { ip: ip });
            invalidateCached(EMAIL_OTP_LOCK.namespace, email); //Remove redis lock for future request for this email;
            setCached(EMAIL_OTP_LOCK.namespace, email, true, CACHE_TTL.MEDIUM);
            return failResponse({ message: "Too many attempts. Request a new OTP." }, 429, undefined, undefined, true);
        };
        //hex to buffer for fater comparisons
        const expected = Buffer.from(stored, "hex");
        const actual = Buffer.from(hashOtp(email, otp), "hex");

        const match = expected.length === actual.length && timingSafeEqual(expected, actual) //Creating buffers because hashing and comparing buffers is faster than hashing and comparing strings, timingSafeEqual makes both buffers equal length, so timingSafeEqual can't throw error

        if (!match) {
            return failResponse({ message: `Invalid OTP. You have ${MAX_ATTEMPTS - attempts} attempts left.` }, 401, undefined, undefined, true);
        }
        await connectDB(process.env.MONGODB_URI!);


        //Mark email verified and set in redis to Update user verfication flog on registeration
        // await UserToken.deleteOne({ _id: tokenDoc._id }, { session }).exec();
        // let result = await User.updateOne(
        //     { email: email, isVerified: false },
        //     { $set: { isVerified: true } },
        //     {}
        // ).exec();
        // if (result.matchedCount === 0) {
        //     logger.info("User not found", { email });
        //     return NextResponse.json({ message: "User not found" }, { status: 404 });
        // }



        //Update and delete the cached lock, when user verifies email or resend email attempted
        await Promise.allSettled([
            invalidateCached(ATTEMPT_EMAIL_VERIFICATION.namespace, email), //Remove redis lock for future request for this email;
            invalidateCached(OTP_VERIFICATION_EMAIL.namespace, email),
            invalidateCached(EMAIL_OTP_LOCK.namespace, email),//remove lock for future request
            setCached(USER_VERIFIED_FLAG.namespace, email, "1", 15 * 60) ///use this flag while new user registration
        ]);
        return successResponse({
                message: "Email verified successfully",
                success: true,
            }, 200, undefined, undefined, true);
    } catch (error: unknown) {
        const message = getErrorMessage(error, "Email Verification Failed")
        logger.error("Email verification error:", { message });
        return failResponse({ message: `Error in verifying email` }, 500, undefined, undefined, true);
    }
}
