// lib/otpStore.ts

import { createHmac } from "node:crypto";

export const hashOtp: (email: string, otp: string) => string = (email: string, otp: string) => createHmac('sha256', process.env.OTP_SECRET_KEY!).update(`${email}:${otp}`).digest("hex")