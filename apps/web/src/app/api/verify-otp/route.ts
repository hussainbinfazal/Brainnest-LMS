import otpStore from '@/lib/otpStore';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { phoneNumber, otp } = await request.json();

        if (!phoneNumber || !otp) {
            return NextResponse.json({ message: 'Phone number and OTP are required' }, { status: 400 });
        }

        const storedOtpData = otpStore[phoneNumber];

        if (!storedOtpData) {
            return NextResponse.json({ message: 'OTP not found or expired' }, { status: 400 });
        }

        // Check if OTP has expired
        if (Date.now() > storedOtpData.expires) {
            delete otpStore[phoneNumber];
            return NextResponse.json({ message: 'OTP has expired' }, { status: 400 });
        }

        // Verify OTP
        if (otp.trim() === storedOtpData.otp) {
            delete otpStore[phoneNumber]; // Clean up
            return NextResponse.json({ message: 'OTP verified successfully' });
        } else {
            return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('OTP verification error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `OTP verification failed :${message }` }, { status: 500 });
    }
}