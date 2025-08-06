import { NextResponse } from 'next/server';
import otpGenerator from 'otp-generator';
import otpStore from '@/lib/otpStore';
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(request) {
    try {
        const { phoneNumber } = await request.json();

        // Format phone number to E.164 format
        let formattedPhone = phoneNumber.toString().replace(/\D/g, ''); // Remove non-digits
        if (formattedPhone.length === 10) {
            formattedPhone = '+91' + formattedPhone; // Add India country code
        } else if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+' + formattedPhone;
        }

        // Validate phone number format
        if (!/^\+[1-9]\d{1,14}$/.test(formattedPhone)) {
            return NextResponse.json({ message: 'Invalid phone number format' }, { status: 400 });
        }

        console.log('Formatted phone number:', formattedPhone);
        console.log('Twilio FROM number:', process.env.TWILIO_PHONE_NUMBER);

        const otp = otpGenerator.generate(6, {
            digits: true,
            alphabets: false,
            upperCase: false,
            specialChars: false,
        });

        // Store OTP with expiry (5 minutes)
        otpStore[phoneNumber] = {
            otp,
            expires: Date.now() + 5 * 60 * 1000
        };

        // Send SMS via Twilio or fallback for development
        if (process.env.NODE_ENVIRONMENT === 'production' && process.env.TWILIO_PHONE_NUMBER?.startsWith('+1')) {
            try {
                const message = await client.messages.create({
                    body: `Your Brainnest verification code is: ${otp}`,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: formattedPhone
                });
                console.log('Twilio message SID:', message.sid);
            } catch (twilioError) {
                console.error('Twilio SMS error:', twilioError);
                console.log(`SMS fallback for ${formattedPhone}: Your Brainnest verification code is: ${otp}`);
            }
        } else {
            // Development mode - just log the OTP
            console.log(`[DEV] SMS to ${formattedPhone}: Your Brainnest verification code is: ${otp}`);
        }

        return NextResponse.json({ 
            message: 'OTP sent successfully',
            ...(process.env.NODE_ENVIRONMENT === 'development' && { otp })
        });
    } catch (error) {
        console.error('Twilio error:', error);
        return NextResponse.json({ message: 'Failed to send OTP' }, { status: 500 });
    }
}