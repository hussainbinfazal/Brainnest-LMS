import { Request, Response } from "express";
import { connectDB, IUser, logger, User, Chat, validateMongooseId } from '@repo/shared';

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
        logger.error("Error in finding chat", { message });
        return response.status(500).json({ message: `Error in finding chat`, status: 500 });
    }
}

//Chat Stats
export async function getChatStatsAdmin(request: Request, response: Response): Promise<Response> {
    try {
        await connectDB(process.env.MONGODB_URI!);
        const userAdmin = request.user;
        const userId = userAdmin?.id;
        if (!validateMongooseId({ userId })) {
            logger.warn("Invalid user id", { userId });
            return response.status(400).json({ message: "Invalid user id"})
        }

        const [userDB, chats] = await Promise.all([
            User.exists({ _id: userId }).select("role").lean(),
            Chat.findOne({ receiver: userId }).populate('paymentsByUser', 'amount paymentAt paymentBy').populate('paymentResult', 'status update_time email_address').populate('allMessages').lean()
        ])
        if (userDB?.role !== 'instructor') return response.status(401).json({ message: "You are not authorized to access this route" });
        return response.status(200).json({ chats });

    } catch (error: unknown) {
        const message = error instanceof Error ? 
        error.message : 'Unknown error';
        logger.error("Error in getting chat stats", { message });
        
        return response.status(500).json({ message: `Error in getting chat stats` });
    }
}