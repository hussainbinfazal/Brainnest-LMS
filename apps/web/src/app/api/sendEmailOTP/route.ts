import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";

import { NextRequest, NextResponse } from 'next/server';
import otpGenerator from 'otp-generator';
import { logger } from '@repo/shared';
import { ATTEMPT_EMAIL_VERIFICATION, checkIp, COOLDOWN_VERIFICATION_EMAIL, OTP_VERIFICATION_EMAIL } from '@repo/shared/server';
import { getErrorMessage } from "@repo/shared"
import { sendEmailBodySchema } from '@repo/shared/client';
import { CACHE_TTL, invalidateCached, setCached, setOnlyIfNotExist } from '@repo/shared/config/redisConfig/cache-helper';
import { hashOtp } from '@/lib/OtpValidators';
import { OTP_SEND_EMAIL_IP_KEY } from "@repo/shared/config/redisConfig/redisRateLimitKeys";
import axios from "axios";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";


function generateOTP(): string {
    return otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });
};



export async function POST(request: NextRequest): Promise<NextResponse> {

    const { allowed, remaining, retryAfterSec, ip } = await checkIp(request, OTP_SEND_EMAIL_IP_KEY.namespace, OTP_SEND_EMAIL_IP_KEY.max, OTP_SEND_EMAIL_IP_KEY.windowSec);
    if (!allowed) {
        return failResponse({ message: 'Too many requests, please try again later' }, 429, undefined, { 'Retry-After': String(retryAfterSec) }, true);
    }
    ///If user is registering first time
    const body = await parseBody(request, sendEmailBodySchema);
    if (!body.ok) {
        logger.info("Invalid Payload", { ip: ip });
        return body.response;
    }
    const { email } = body.data;
    console.log("URL of the worker in the sendEmail route", `${process.env.EMAIL_API_URL}/internal/email-otp`);
    try {
        //Atomic
        const acquired = await setOnlyIfNotExist(COOLDOWN_VERIFICATION_EMAIL.namespace, email, "1", CACHE_TTL.SHORT); //acquire lock
        if (!acquired) {
            return failResponse({ message: 'Too many requests, please try again later' }, 429, undefined, { 'Retry-After': String(CACHE_TTL.SHORT) }, true);
        }
        //
        // curl - i - X POST localhost: 3000 / api / send - email - otp - d '{"email":"a@x.com"}'
        const otp = generateOTP();
        await Promise.all([
            setCached(OTP_VERIFICATION_EMAIL.namespace, email, hashOtp(email, otp), CACHE_TTL.SHORT), //Set otp in redis, so that it can be verified in the next request in verify route.
            setCached(ATTEMPT_EMAIL_VERIFICATION.namespace, email, "0", CACHE_TTL.SHORT), ///Set Attempts to zero then increase them in the verify route on every request.
        ]);


        // Send email via nodemailer //use worker queue from the shared repo, via http call to add the job in the job in queue
        //  
        const response = await axios.post(
            `${process.env.EMAIL_API_URL}/internal/email-otp`,
            {
                email,
                otp,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-secret': process.env.INTERNAL_AUTH_SECRET!,
                },
                timeout: 5000
            }
        );

        // The worker responds with 201 when the email job is queued.
        if (response.status < 200 || response.status >= 300) {
            throw new Error(`Worker returned HTTP ${response.status}`);
        }

        return successResponse({
            message: 'OTP sent to email successfully',
            // ...(process.env.NODE_ENV! === 'development' && { email })
        }, 202, undefined, undefined, true);
    } catch (error: unknown) {
        // console.log("This is the error in the catch block of send Email Otp route", error);

        // Don't leave the user locked in a cooldown for an email that was never sent
        await Promise.allSettled([
            invalidateCached(COOLDOWN_VERIFICATION_EMAIL.namespace, email),
            invalidateCached(OTP_VERIFICATION_EMAIL.namespace, email),
        ]);
        const message: string = getErrorMessage(error, "Email service is temporary Unavailable");
        const isAxiosError = axios.isAxiosError(error);
        const status = isAxiosError && error.code === 'ECONNABORTED' ? 504 : 502;
        logger.error('Email OTP worker error', {
            ip,
            email,
            errorCode: isAxiosError ? error.code : undefined,
            workerStatus: isAxiosError ? error.response?.status : error instanceof Error ? error.message : undefined,
            workerBody: isAxiosError ? error.response?.data : undefined,   // <-- you're missing this
            error,
            message,
        });
        return successResponse({ message }, 200, undefined, undefined, true);
    }
}