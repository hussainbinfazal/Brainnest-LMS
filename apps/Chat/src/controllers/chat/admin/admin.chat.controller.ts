import { Request, Response } from "express";
import { connectDB, logger } from '@repo/shared';
import {Chat} from "@repo/shared";
import { ISessionUser } from "@repo/shared";




export async function getChatOfAdmin(request: Request, response: Response): Promise<Response> {
    try {
        const admin = request.user;
        const adminId = admin?.id;
        await connectDB(process.env.MONGODB_URI);
        const chatOfAdmins = await Chat.find(({ receiver: adminId })).populate('receiver', 'name profileImage').populate('sender', 'name profileImage').populate('paymentResult', 'status update_time email_address').populate('paymentsByUser', 'amount paymentAt paymentBy').populate('allMessages').lean();
        if (!chatOfAdmins) return response.status(404).json({ message: "Chat not found", status: 404 });
        return response.status(200).json({ message: "Chat found successfully", chatOfAdmins, status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.info("There is a error on the server side", {message});
        return response.status(500).json({ message: `Error in finding chat`,status: 500 });
    }
}