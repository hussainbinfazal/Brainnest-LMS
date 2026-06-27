// import otpStore from '@/lib/otpStore';
// import { logger } from '@repo/shared';
// import { NextRequest, NextResponse } from 'next/server';

// export async function POST(request: NextRequest): Promise<NextResponse> {
//     try {
//         const { phoneNumber, otp } = await request.json();

//         if (!phoneNumber || !otp) {
//             logger.info("Phone number and OTP are required");
//             return NextResponse.json({ message: 'Phone number and OTP are required' }, { status: 400 });
//         }

//         const storedOtpData:{otp:string,expires:number} = otpStore[phoneNumber];

//         if (!storedOtpData) {
//             return NextResponse.json({ message: 'OTP not found or expired' }, { status: 400 });
//         }

//         // Check if OTP has expired
//         if (Date.now() > storedOtpData.expires) {
//             logger.info("OTP has expired");
//             delete otpStore[phoneNumber];
//             return NextResponse.json({ message: 'OTP has expired' }, { status: 400 });
//         }

//         // Verify OTP
//         if (otp.trim() === storedOtpData.otp) {
//             logger.info("OTP verification success");
//             delete otpStore[phoneNumber]; // Clean up
//             return NextResponse.json({ message: 'OTP verified successfully' });
//         } else {
//             logger.info("OTP verification failed");
//             return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 });
//         }
//     } catch (error: unknown) {
//         const message = error instanceof Error ? error.message : 'Unknown error';
//         logger.error('OTP verification error:', {error:message});
//         return NextResponse.json({ message: `OTP verification failed :${message }` }, { status: 500 });
//     }
// }