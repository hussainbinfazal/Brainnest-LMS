import { NextRequest, NextResponse } from 'next/server';
import otpGenerator from 'otp-generator';
import otpStore from '@/lib/otpStore';
import twilio from 'twilio';
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';
import { CustomNextRequest } from '@/types/server';
import { logger } from '@/utils/logger/logger.node';

const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    try {
        const { phoneNumber } = await request.json();

        // Format phone number to E.164 format
        let formattedPhone: string = phoneNumber.toString().replace(/\D/g, ''); // Remove non-digits
        if (formattedPhone.length === 10) {
            formattedPhone = '+91' + formattedPhone; // Add India country code
        } else if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+' + formattedPhone;
        }

        // Validate phone number format
        if (!/^\+[1-9]\d{1,14}$/.test(formattedPhone)) {
            return NextResponse.json({ message: 'Invalid phone number format' }, { status: 400 });
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
        otpStore[phoneNumber] = {
            otp,
            expires: Date.now() + 5 * 60 * 1000
        };

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

        return NextResponse.json({
            message: 'OTP sent successfully',
            ...(process.env.NODE_ENV === 'development' && { otp })
        });
    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Twilio error:', { message: message, error: error });
        return NextResponse.json({ message: message }, { status: 500 });
    }
}