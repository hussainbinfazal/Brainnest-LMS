import nodemailer, { SentMessageInfo } from 'nodemailer';
import {User} from "@repo/shared";
import bcryptjs from 'bcryptjs';
import { connectDB } from '@repo/shared';
import { logger } from "@/utils/logger/logger.node";

export type EmailType = "RESET";

// complete the logic of reset Password

export const sendEmail = async (email: string, emailType: EmailType = "RESET", userId: string, token: string): Promise<SentMessageInfo> => {
    try {
        await connectDB(process.env.MONGODB_URI!);        
        const transporter : nodemailer.Transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: Number(process.env.MAILTRAP_PORT),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.MAILTRAP_USER,
                pass: process.env.MAILTRAP_PASSWORD,
            },
        });

        const mailOptions: nodemailer.SendMailOptions = {
            from: 'Brainnest@gmail.com',
            to: email,
            subject: "Reset your password",
            html: `<p>Click <a href="${process.env.DOMAIN}/verifyemail?token=${token}">here</a> to ${emailType}
            or copy and paste the link below in your browser. <br> ${process.env.DOMAIN}/verifyemail?token=${token}
            </p>`
        }

        const mailResponse: SentMessageInfo = await transporter.sendMail(mailOptions);
        logger.info("Email sent successfully to " + email, { mailResponse });                      
        return mailResponse
    } catch (error:unknown) {
        logger.error("Error sending email", { error });
        throw error
    }
}

// Looking to send emails in production? Check out our Email API/SMTP product!
