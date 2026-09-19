import nodemailer, { SentMessageInfo } from 'nodemailer';
import { User, UserToken, validateEmail } from "@repo/shared";
import { logger } from "@/utils/logger/logger.node";
import crypto from "crypto";
export type EmailType = "RESET" | "VERIFY_OTP";

// complete the logic of reset Password

const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: Number(process.env.MAILTRAP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASSWORD,
    },
    pool: true,
    maxConnections: 20
    , maxMessages: 0
})


export const sendResetEmail = async (email: string, token: string): Promise<SentMessageInfo> => {
    try {
        const mailOptions: nodemailer.SendMailOptions = {
            from: 'Brainnest@gmail.com',
            to: email,
            subject: 'Reset your Brainnest Password',
            html: ` <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Password Reset</ h2 >
            <p>Click below to reset your password.This link expires in 15 minutes.</p>
                < p > <a href="${process.env.DOMAIN}/reset-password?token=${token}" > Reset Password < /a></p >
                    <p>Or paste this URL into your browser: <br>${process.env.DOMAIN} /reset-password?token=${token}</p >
                        <p>If you didn't request this, ignore this email.</p>
                            </div>`
        };
        const mailResponse: SentMessageInfo = await transporter.sendMail(mailOptions);
        logger.info("Email sent successfully to " + email, { mailResponse });
        return mailResponse
    } catch (error: unknown) {
        const message: string = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error sending email", { error, message });
        throw error
    }
}

const OTP_TTL_MS = 5 * 60 * 1000;

export async function sendEmailOtp(userId: string, email: string, otp: string): Promise<SentMessageInfo | null> {
    if (!validateEmail(email)) {
        logger.error("sendEmailOtp: invalid email, skipping without retry", { userId, email });
        return null;
    };
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Single atomic upsert: replaces deleteMany + save (2 round trips, and a race window
    // where two concurrent OTP requests could both pass the delete and each insert a doc).
    // The unique index on {userId, type} makes this upsert race-safe on its own.
    await UserToken.findOneAndUpdate(
        { userId, type: "email-verification" },
        { token: hashedOtp, expiresAt: new Date(Date.now() + OTP_TTL_MS), attempts: 0 },
        { upsert: true, new: true }
    );

    try {
        const mailResponse = await transporter.sendMail({
            from: '"Brainnest LMS" <noreply@brainnest.com>',
            to: email,
            subject: "Your Brainnest Email Verification Code",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Your Brainnest verification code is:</p>
          <div style="background:#f4f4f4;padding:20px;text-align:center;font-size:24px;font-weight:bold;letter-spacing:2px;margin:20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
        });
        logger.info("OTP email sent", { userId, email, messageId: mailResponse.messageId });
        return mailResponse;
    } catch (error: unknown) {
        // SMTP failure IS retryable — network blips, provider throttling, transient DNS issues.
        // Rethrow so BullMQ's configured attempts/backoff actually kick in.
        logger.error("Failed to send OTP email", { userId, email, error });
        throw error;
    }
};
