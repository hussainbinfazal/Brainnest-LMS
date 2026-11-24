import { auth } from "@/auth";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { workerApiLinks } from "@/utils/workerApiLinks";
import { buildKey, CACHE_TTL, checkIp, checkUser, connectDB, getRedisClient, logger, passJobToWorker, SEND_CODE_EMAIL_IP_KEY, setCached, User, USER_EMAIL_VERIFIED_FLAG, VERIFY_EMAIL_IP_KEY, VERIFY_EMAIL_USER_KEY } from "@repo/shared/server";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import crypto from "crypto";

const sendEmailBodySchema = z.object({
    email: z.string().email()
});
const verifyEmailBodySchema = z.object({
    email: z.string().email(),
    otp: z.string().regex(/^\d{6}$/, "Code must contain exactly 6 digits")
})
export async function POST(request: NextRequest): Promise<NextResponse> {
    const { allowed: ipAllowed, retryAfterSec, ip } = await checkIp(
        request,
        SEND_CODE_EMAIL_IP_KEY.namespace,
        SEND_CODE_EMAIL_IP_KEY.max,
        SEND_CODE_EMAIL_IP_KEY.windowSec
    )
    if (!ipAllowed) {
        logger.warn('Too many attempts', {
            ip: ip
        })
        return failResponse({
            message: "Too many attempts"
        }, 429, undefined, undefined, true)
    };

    const parsedBody = await parseBody(request, sendEmailBodySchema);
    if (!parsedBody.ok) {
        return parsedBody.response
    }
    const email = parsedBody.data.email.trim().toLowerCase();
    try {
        // Get the shared Redis client
        const key = buildKey('verify', email);
        // Key that enforces one code request per email per 60 seconds
        const cooldownKey = `${key}:cooldown`;
        // SET with NX is atomic: it returns "OK" only if the key did not already exist
        const redis = await getRedisClient()
        const attemptsKey = `${key}:attempts`;
        const canSend = await redis.set(cooldownKey, "1", {
            ex: 60,
            nx: true,
        });
        // If the cooldown is still active, refuse without touching the existing code
        if (canSend !== "OK") {
            // 429 tells the client to wait before asking again
            return failResponse({ message: "Please wait before requesting another code" }, 429, undefined, undefined, true);
        }

        // // Increment attempts atomically BEFORE checking the code
        // const attempts = await redis.incr(attemptsKey);
        // // On the first attempt, set an expiry so the counter cleans itself up
        // if (attempts === 1) {
        //     // 10 minutes; should match or exceed the code's own TTL
        //     await redis.expire(attemptsKey, 600);
        // }
        // // Too many wrong guesses for this email: kill the code entirely
        // if (attempts > 5) {
        //     // Delete the code so it cannot be guessed any further
        //     await redis.del(key);
        //     // 429 tells the client to request a new code
        //     return failResponse({ message: "Too many attempts. Request a new code." }, 429, undefined, undefined, true);
        // }

        const code = crypto.randomInt(100_000, 1_000_000).toString();
        // console.log("Here is the generated code ", code)
        ///atomic insert and delete
        await redis
            .multi()
            // Store the code as a plain string with a 10-minute TTL in the same command
            .hset(key, { code })
            // Reset the failed-attempts counter for the fresh code]
            .expire(key, 600)
            .del(attemptsKey)
            .exec();
        // Reset the failed-attempts counter so a fresh code starts clean
        await passJobToWorker(
            workerApiLinks.email.sendOtp,
            {
                email,
                otp: code,
            }
        );
    } catch (workerCallError: unknown) {
        const isAxiosError = axios.isAxiosError(workerCallError);
        const status =
            isAxiosError && workerCallError.code === "ECONNABORTED"
                ? 504
                : 502;

        logger.error("Something went wrong while passing job to the worker", {
            errorCode: isAxiosError ? workerCallError.code : undefined,
            workerStatus: isAxiosError
                ? workerCallError.response?.status
                : undefined,
            error: workerCallError,
        });

        return failResponse(
            {
                success: false,
                message: "Email service is temporarily unavailable",
            },
            status,
            undefined,
            undefined,
            true
        );
    }
    return successResponse({ message: "Verification Code has been sent on this email" },
        202,
        undefined,
        undefined,
        true
    )

}
export async function PUT(request: NextRequest): Promise<NextResponse> {
    const { allowed: ipAllowed, retryAfterSec, ip } = await checkIp(
        request,
        VERIFY_EMAIL_IP_KEY.namespace,
        VERIFY_EMAIL_IP_KEY.max,
        VERIFY_EMAIL_IP_KEY.windowSec
    )
    if (!ipAllowed) {
        logger.warn('Too many attempts', {
            ip: ip
        })
        return failResponse({
            message: "Too many attempts"
        }, 429, undefined, undefined, true)
    };

    const parsedBody = await parseBody(request, verifyEmailBodySchema);
    if (!parsedBody.ok) {
        return parsedBody.response
    }
    const email = parsedBody.data.email.trim().toLowerCase();
    // Extract the code the user submitted
    const { otp } = parsedBody.data;
    try {
        const key = buildKey('verify', email);
        const redis = await getRedisClient()
        const attemptsKey = `${key}:attempts`;

        // Increment attempts atomically BEFORE checking the code
        const attempts = await redis.incr(attemptsKey);
        // On the first attempt, set an expiry so the counter cleans itself up
        if (attempts === 1) {
            // 10 minutes; should match or exceed the code's own TTL
            await redis.expire(attemptsKey, 600);
        }
        // Too many wrong guesses for this email: kill the code entirely
        if (attempts > 5) {
            // Delete the code so it cannot be guessed any further
            await redis.del(key);
            // 429 tells the client to request a new code
            return failResponse({ message: "Too many attempts. Request a new code." }, 429, undefined, undefined, true);
        }

        // Fetch the stored code (await is required; hget returns a Promise)
        const storedCode = await redis.hget(key, "code");
        if (storedCode === null) {
            // Same message as a wrong code, so we don't leak which case it is
            return failResponse({ message: "Invalid or expired code" }, 400, undefined, undefined, true);
        }
        const submittedCode = Buffer.from(otp, "utf8");
        const expectedCode = Buffer.from(String(storedCode) ?? "", "utf8");
        const isValid =
            storedCode !== null &&
            submittedCode.length === expectedCode.length &&
            crypto.timingSafeEqual(submittedCode, expectedCode);

        // Wrong or expired code: same message for both, to avoid leaking which
        if (!isValid) {
            // 400 with a generic message
            return failResponse({ message: "Invalid or expired code" }, 400, undefined, undefined, true);
        }

        // Code is correct: delete it and the counter so it cannot be reused
        await redis.del(key, attemptsKey);
        await connectDB(process.env.MONGODB_URI!)
        await User.updateOne({ email }, { $set: { isVerified: true } });

        await setCached(USER_EMAIL_VERIFIED_FLAG.namespace, email, "1", CACHE_TTL.VERY_LONG)
    } catch (verifyEmailError: unknown) {

        logger.error("Email verification failed", { verifyEmailError });
        // Return a generic 500; PUT never calls the worker, so 502/504 were wrong
        return failResponse({ success: false, message: "Something went wrong" }, 500, undefined, undefined, true);

    }
    return successResponse({ message: "Email Verified Successfully" },
        202,
        undefined,
        undefined,
        true
    )

}