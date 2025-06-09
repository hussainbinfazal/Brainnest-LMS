    import { NextResponse } from 'next/server';
    import otpGenerator from 'otp-generator';
    import otpStore from '@/lib/otpStore';
    // in-memory store for dev only

    export async function POST(request) {
        try {
            const { phoneNumber } = await request.json();

            const otp = otpGenerator.generate(6, {
                digits: true,
                alphabets: false,
                upperCase: false,
                specialChars: false,
            });

            // console.log('This is the generated otp', otp)
            // Store OTP (this should ideally be stored in DB with expiry)
            const otpGenerated = otpStore[phoneNumber] = otp;
            // console.log('This is the otpStore in the save OTP', otpStore)

            // console.log(`OTP for ${phoneNumber}: ${otp}`); // simulate SMS

            return NextResponse.json({ message: 'OTP sent successfully' ,otp:otpGenerated});
        } catch (error) {
            console.error(error);
            return NextResponse.json({ message: 'Failed to send OTP' }, { status: 500 });
        }
    }