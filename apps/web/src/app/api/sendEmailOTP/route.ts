import { NextResponse } from 'next/server';
import otpGenerator from 'otp-generator';
import { CustomNextRequest, ISessionUser } from '@/types/server';
import { logger } from '@/utils/logger/logger.node';
import { Session } from 'next-auth';
import { auth } from '@/auth';
import { validateEmail } from '@repo/shared';
import { createHmac } from 'node:crypto';
import { invalidateCached, setCached } from '@repo/shared/config/redisConfig/cache-helper';

const OTP_TTL_SEC = 60;
const RESEND_COOLDOWN_SEC = 60;

function generateOTP(): string {
    return otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });
}
const hashOtp = (email: string, otp: string) => createHmac('sha256', process.env.OTP_SECRET_KEY!).update(`${email}:${otp}`).digest("hex")

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    ///If user is registering first time
    const body = await request.json()
    let email = body.email;
    if (!email || !validateEmail(email.trim())) {
        return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    };
    const cooldownKey: string = `email-otp-cooldown`;
    const otpKey: string = `${email}`;
    try {
        //Atomic
        const acquired = await setCached(cooldownKey, otpKey, 1, RESEND_COOLDOWN_SEC); //acquire lock
        if (!acquired) {
            return NextResponse.json({ message: 'Too many requests, please try again later' }, { status: 429, headers: { 'Retry-After': String(RESEND_COOLDOWN_SEC) } });
        }
        //
        // curl - i - X POST localhost: 3000 / api / send - email - otp - d '{"email":"a@x.com"}'
        const otp = generateOTP();
        await setCached(otpKey, hashOtp(email, otp), OTP_TTL_SEC);
        // Send email via nodemailer //use worker queue from the shared repo, via http call to invoke the job in the job in queue
        //  
        return NextResponse.json({
            message: 'OTP sent to email successfully',
            // ...(process.env.NODE_ENV! === 'development' && { email })
        }, { status: 202 });
    } catch (error: unknown) {
        // Don't leave the user locked in a cooldown for an email that was never sent
        await invalidateCached(otpKey);
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Email OTP error:', { error, message });
        return NextResponse.json({ message: `Failed to send email OTP` }, { status: 500 });
    }
}