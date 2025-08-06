import otpStore from '@/lib/otpStore';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { email, otp } = await request.json();
        
        if (!email || !otp) {
            return NextResponse.json({ message: 'Email and OTP are required' }, { status: 400 });
        }

        const storedOtpData = otpStore[email];
        
        if (!storedOtpData) {
            return NextResponse.json({ message: 'OTP not found or expired' }, { status: 400 });
        }

        // Check if OTP has expired
        if (Date.now() > storedOtpData.expires) {
            delete otpStore[email];
            return NextResponse.json({ message: 'OTP has expired' }, { status: 400 });
        }

        // Verify OTP
        if (otp.trim() === storedOtpData.otp) {
            delete otpStore[email]; // Clean up
            return NextResponse.json({ message: 'Email OTP verified successfully' });
        } else {
            return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 });
        }
    } catch (error) {
        console.error('Email OTP verification error:', error);
        return NextResponse.json({ message: 'Email OTP verification failed' }, { status: 500 });
    }
}