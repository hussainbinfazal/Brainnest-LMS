import userToken from "@/models/User/userToken";
import { logger } from "@/utils/logger/logger.node";
import nodemailer from "nodemailer";
import crypto from "crypto";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});
export async function sendEmail(userId: string, email: string, otp: string): Promise<void> {
    await userToken.deleteMany({ userId: userId, type: "reset" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        logger.error("Invalid email format");
        throw new Error("Invalid email format");
    }
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    try {
        const issueUserToken = await new userToken({
            userId: userId,
            type: "reset",
            token: hashedOtp,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            isVerified: false
        })

        await issueUserToken.save();
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
        })

        // Implement email sending logic her 
        logger.info(`Sending email to ${email} with OTP`);
    } catch (error: any) {
        logger.error("Error sending email", error);
        throw error;
    }

}