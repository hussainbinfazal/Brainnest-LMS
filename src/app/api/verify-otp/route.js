
import otpStore from '@/lib/otpStore';
import { NextResponse } from 'next/server';
export async function POST(request) {
    try {
        const { phoneNumber, otp } = await request.json();
        if (!phoneNumber || !otp) {
            return NextResponse.json({ message: 'Phone number and OTP are required' }, { status: 400 });
        }
        const receivedOtp = otp.trim();
        console.log("Received Otp From the body",receivedOtp);
        const receivedPhoneNumber = phoneNumber.trim();
        console.log("Received Phone Number From the body",receivedPhoneNumber);
        const validOtp = otpStore[phoneNumber];
        console.log("Valid Otp From the otpStore", validOtp);
        if (otp === validOtp) {
            delete otpStore[phoneNumber]; // clean up
            return NextResponse.json({ message: 'OTP verified successfully' });
        } else {
            return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 });
        }
    } catch (error) {
        console.log(error)
        console.error(error);
        return NextResponse.json({ message: 'OTP verification failed' }, { status: 500 });
    }
}