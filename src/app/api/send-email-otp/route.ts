import { NextRequest, NextResponse } from 'next/server';
import otpGenerator from 'otp-generator';
import { sendEmail } from '@/services/emailOtpService';
import { ISessionUser } from '@/types/server';
import { getDataFromToken } from '@/utils/getDataFromToken';
import { logger } from '@/utils/logger/logger';
import { validateMongooseId } from '@/utils/schemaValidation/idValidator/idValidator';
import { emailOtpQueue } from '@/lib/queue/emailQueue';
interface CustomNextRequest extends NextRequest {
    ip: string;
}

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    try {
        const body = await request.json().catch(() => null);
        const user: ISessionUser | null = await getDataFromToken(request);
        if (!user || !user.id) {
            logger.info("Unauthorized access", { route: "send-otp", ip: request.ip  });
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }
        const email = user.email;
        if (!validateMongooseId({userId: user.id})) {
            logger.info("Invalid user id");
            return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
        }
        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
        }

        const otp = otpGenerator.generate(6, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        });

        // Store OTP with expiry (5 minutes)
        // otpStore[email] = {
        //     otp,
        //     expires: Date.now() + 5 * 60 * 1000
        // };

        // Send email via nodemailer
        await emailOtpQueue.add("send-otp", {
            userId: user.id,
            email,
            otp
        });
        return NextResponse.json({
            message: 'OTP sent to email successfully',
            ...(process.env.NODE_ENVIRONMENT! === 'development' && { email })
        }, { status: 202 });
    } catch (error: any) {
        console.error('Email OTP error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `Failed to send email OTP : ${message}` }, { status: 500 });
    }
}