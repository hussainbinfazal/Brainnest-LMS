import { NextResponse } from 'next/server';
import otpGenerator from 'otp-generator';
import { CustomNextRequest, ISessionUser } from '@/types/server';
import { logger } from '@/utils/logger/logger.node';
import { ATTEMPT_EMAIL_VERIFICATION, COOLDOWN_VERIFICATION_EMAIL, OTP_VERIFICATION_EMAIL, validateEmail } from '@repo/shared';
import { createHmac } from 'node:crypto';
import { CACHE_TTL, invalidateCached, setCached, setOnlyIfNotExist } from '@repo/shared/config/redisConfig/cache-helper';
import z from 'zod';


function generateOTP(): string {
    return otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });
}


const sendEmailOTPSchema: z.ZodType<{ email: string }> = z.object({
    email: z.string().email(),
})
const hashOtp = (email: string, otp: string) => createHmac('sha256', process.env.OTP_SECRET_KEY!).update(`${email}:${otp}`).digest("hex")

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    ///If user is registering first time
    const body = await request.json().catch(() => null);
    const parsed = sendEmailOTPSchema.safeParse(body);
    if (!parsed.success) {
        logger.info("Invalid Payload", { ip: request.ip });
        return NextResponse.json({ message: "Invalid Payload" }, { status: 400 });
    }
    const { email } = parsed.data;
    if (!email || !validateEmail(email)) {
        return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    }

    try {
        //Atomic
        const acquired = await setOnlyIfNotExist(COOLDOWN_VERIFICATION_EMAIL.namespace, email, "1", CACHE_TTL.SHORT); //acquire lock
        if (!acquired) {
            return NextResponse.json({ message: 'Too many requests, please try again later' }, { status: 429, headers: { 'Retry-After': String(CACHE_TTL.SHORT) } });
        }
        //
        // curl - i - X POST localhost: 3000 / api / send - email - otp - d '{"email":"a@x.com"}'
        const otp = generateOTP();
        await Promise.allSettled([
            setCached(OTP_VERIFICATION_EMAIL.namespace, email, hashOtp(email, otp), CACHE_TTL.SHORT), //Set otp in redis, so that it can be verified in the next request in verify route.
            setCached(ATTEMPT_EMAIL_VERIFICATION.namespace, email, "0", CACHE_TTL.SHORT), ///Set Attempts to zero then increase them in the verify route on every request.
        ]);







        
        // Send email via nodemailer //use worker queue from the shared repo, via http call to invoke the job in the job in queue
        //  
        return NextResponse.json({
            message: 'OTP sent to email successfully',
            // ...(process.env.NODE_ENV! === 'development' && { email })
        }, { status: 202 });
    } catch (error: unknown) {
        // Don't leave the user locked in a cooldown for an email that was never sent
        await Promise.allSettled([
            invalidateCached(COOLDOWN_VERIFICATION_EMAIL.namespace, email),
            invalidateCached(OTP_VERIFICATION_EMAIL.namespace, email),
        ]);
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Email OTP error:', { error, message });
        return NextResponse.json({ message: `Failed to send email OTP` }, { status: 500 });
    }
}