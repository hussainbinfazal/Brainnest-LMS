import nodemailer, { SentMessageInfo } from 'nodemailer';
import User from "@/models/userModel";
import bcryptjs from 'bcryptjs';
import { connectDB } from '@/config/db';

export type EmailType = "RESET" | "VERIFY";

export const sendEmail = async (email: string, emailType: EmailType = "RESET", userId: string): Promise<SentMessageInfo> => {
    try {
        await connectDB();

        const hashedToken = await bcryptjs.hash(userId.toString(), 10);
        console.log("This is the hashed token:",hashedToken);
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
    } catch (error) {
        throw error
    }
}

// Looking to send emails in production? Check out our Email API/SMTP product!
