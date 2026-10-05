import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextRequest, NextResponse } from 'next/server';
import otpGenerator from 'otp-generator';
import twilio from 'twilio';
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';
import { CustomNextRequest } from '@/types/server';
import { logger } from '@repo/shared';
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";

const sendSmsOtpBodySchema = z.object({
    phoneNumber: z.union([z.string(), z.number()]).transform(String),
});
const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    try {
        const body = await parseBody(request, sendSmsOtpBodySchema);
        if (!body.ok) return body.response;
        const { phoneNumber } = body.data;

        // Format phone number to E.164 format
        let formattedPhone: string = phoneNumber.toString().replace(/\D/g, ''); // Remove non-digits
        if (formattedPhone.length === 10) {
            formattedPhone = '+91' + formattedPhone; // Add India country code
        } else if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+' + formattedPhone;
        }

        // Validate phone number format
        if (!/^\+[1-9]\d{1,14}$/.test(formattedPhone)) {
            return failResponse({ message: 'Invalid phone number format' }, 400, undefined, undefined, true);
        }

        logger.info('Formatted phone number:', { formattedPhone });
        logger.info('Twilio FROM number:', process.env);

        const otp = otpGenerator.generate(6, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        });

        // Store OTP with expiry (5 minutes)
        // otpStore[phoneNumber] = {
        //     otp,
        //     expires: Date.now() + 5 * 60 * 1000
        // };

        // Send SMS via Twilio or fallback for development
        if (process.env.NODE_ENV! === 'production' && process.env.TWILIO_PHONE_NUMBER!?.startsWith('+1')) {
            try {
                const message: MessageInstance = await client.messages.create({
                    body: `Your Brainnest verification code is: ${otp}`,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: formattedPhone
                });
                logger.info('Twilio message SID:', { message: message.sid });
            } catch (twilioError: any) {
                logger.error('Twilio SMS error:', twilioError);
                logger.error(`SMS fallback for ${formattedPhone}: Your Brainnest verification code is: ${otp}`);
            }
        } else {
            // Development mode - just log the OTP
            logger.info(`[DEV] SMS to ${formattedPhone}: Your Brainnest verification code is: ${otp}`);
        }

        return successResponse({
            message: 'OTP sent successfully',
            ...(process.env.NODE_ENV === 'development' && { otp })
        }, 200, undefined, undefined, true);
    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Twilio error:', { message: message, error: error });
        return failResponse({ message: message }, 500, undefined, undefined, true);
    }
}