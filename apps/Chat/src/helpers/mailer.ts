import nodemailer, { SentMessageInfo } from 'nodemailer';

import bcryptjs from 'bcryptjs';

import User from '../../../../packages/shared/src/models/User/userModel';
import { connectDB } from '../../../../packages/shared/src/config/mongoDB/db';
import { logger } from '../../../../packages/shared/src/logger/logger';
export type EmailType = "RESET" | "VERIFY";

export const sendEmail = async (email: string, emailType: EmailType = "RESET", userId: string): Promise<SentMessageInfo> => {
    try {
        await connectDB();

        const hashedToken = await bcryptjs.hash(userId.toString(), 10);
        logger.info("Generated email token",{ hashedToken });
        await User.findByIdAndUpdate(userId,
            { resetPasswordToken: hashedToken, resetPasswordTokenExpires: Date.now() + 3600000 })

        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: Number(process.env.MAILTRAP_PORT),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.MAILTRAP_USER,
                pass: process.env.MAILTRAP_PASSWORD,
            },
        });

        const mailOptions = {
            from: 'Brainnest@gmail.com',
            to: email,
            subject: emailType === "RESET" ? "Reset your password" : "Verify your email",
            html: `<p>Click <a href="${process.env.DOMAIN}/verifyemail?token=${hashedToken}">here</a> to ${emailType === "RESET" ? "reset your password" : "verify your email"}
            or copy and paste the link below in your browser. <br> ${process.env.DOMAIN}/verifyemail?token=${hashedToken}
            </p>`
        }

        const mailResponse = await transporter.sendMail(mailOptions);
        return mailResponse
    } catch (error: any) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error("Error sending email to " + email + ": " + message);
        throw error
    }
}

// Looking to send emails in production? Check out our Email API/SMTP product!
