// lib/otpStore.ts

import { createHmac } from "node:crypto";

export const hashOtp: (email: string, otp: string) => string = (email: string, otp: string) => {
    const secret = process.env.OTP_SECRET_KEY!;
    // if (!secret) {
    //     throw new Error("OTP_SECRET_KEY is missing from environment variables.");

    // }
    return createHmac('sha256', secret).update(`${email}:${otp}`).digest("hex")
}