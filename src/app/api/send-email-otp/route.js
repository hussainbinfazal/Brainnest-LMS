import { NextResponse } from 'next/server';
import otpGenerator from 'otp-generator';
import otpStore from '@/lib/otpStore';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

export async function POST(request) {
    try {
        const { email } = await request.json();

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
        }

        const otp = otpGenerator.generate(6, {
            digits: true,
            alphabets: false,
            upperCase: false,
            specialChars: false,
        });

        // Store OTP with expiry (5 minutes)
        otpStore[email] = {
            otp,
            expires: Date.now() + 5 * 60 * 1000
        };

        // Send email via nodemailer
        try {
            await transporter.sendMail({
                from: '"Brainnest LMS" <noreply@brainnest.com>',
                to: email,
                subject: 'Your Brainnest Email Verification Code',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Email Verification</h2>
                        <p>Your Brainnest verification code is:</p>
                        <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
                            ${otp}
                        </div>
                        <p>This code will expire in 5 minutes.</p>
                        <p>If you didn't request this code, please ignore this email.</p>
                    </div>
                `
            });
            console.log('Email sent successfully to:', email);
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            // Fallback to console log for development
            console.log(`Email would be sent to ${email}: Your Brainnest verification code is: ${otp}`);
        }

        return NextResponse.json({ 
            message: 'OTP sent to email successfully',
            ...(process.env.NODE_ENVIRONMENT === 'development' && { otp, email })
        });
    } catch (error) {
        console.error('Email OTP error:', error);
        return NextResponse.json({ message: 'Failed to send email OTP' }, { status: 500 });
    }
}