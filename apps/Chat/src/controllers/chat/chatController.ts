import { Request as ExpressRequest, Response } from "express";
import Razorpay from 'razorpay';
import { connectDB } from '@repo/shared';
import {User,Course, logger ,Chat,IChat,Message} from '@repo/shared';
import mongoose from "mongoose";

interface AuthRequest extends ExpressRequest {
    user?: {
        id: string;
        email?: string;
        name?: string;
        role?: string;
        phoneNumber?: string;
        profileImage?: string;
    };
}

export async function getChat(request: ExpressRequest, response: Response): Promise<Response> {
    await connectDB(process.env.MONGODB_URI!);
    try {
        const { id: userId } = request.params as { id: string };
        // console.log("This is the user Id", userId);
        const chat: IChat | null = await Chat.findOne({ sender: userId }).lean();
        if (!chat) return response.json({ message: "Chat not found" , status: 404});
        return response.json({
            message: "Chat found successfully",
            chat,
            status: 200

        });

    } catch (error: unknown) {
        logger.info("Error in finding chat",{error});
        const message = error instanceof Error ? error.message : 'Unknown error';
        return response.json({ error: `Error in finding chat: ${message}`,  status: 400  });


    }
}

export async function getAllChat(request: AuthRequest, response: Response): Promise<Response> {
    await connectDB(process.env.MONGODB_URI!);
    try {
        
        const session = request.user; // authorize user on the socket handshake from the frontend
        if (!session?.id) {
            return response.json({ message: "Unauthorized", status: 401 });
        }
        const userId: string = session.id;

        const chat: IChat[] = await Chat.find({ sender: userId }).populate('sender', '_id name profileImage').populate('receiver', '_id name profileImage').populate('allMessages').lean();
        if (!chat) return response.json({ message: "Chat not found",status: 404 },);
        logger.info("Chat found successfully");
        return response.json({
            message: "Chat found successfully",
            chat,status: 200
        });

    } catch (error: any) {
        logger.error("Error in finding chat ",{error});
        const message = error instanceof Error ? error.message : 'Unknown error';
        return response.json({ error: `Failed to find chat: ${message}`,status: 400 });


    }
}


export async function createChat(request: ExpressRequest, response: Response): Promise<Response> {
    await connectDB(process.env.MONGODB_URI!);
    try {
        let { sender, receiver } = await request.body;
        const existingChat = await Chat.find({ sender, receiver });
        if (existingChat.length > 0)
            return response.json({ message: "Chat already Initialized",status: 400 });
        logger.info("This is the sender and receiver of chat",{ sender, receiver });
        const chat = new Chat({ sender, receiver });
        await chat.save();
        logger.info("Chat created successfully");
        return response.json({
            message: "Chat created successfully",
            chat,
            status: 200
        },);

    } catch (error: unknown) {
        logger.error("Error in creating chat",{error});
        const message = error instanceof Error ? error.message : 'Unknown error';
        return response.json({ error: `Error in creating chat: ${message}`,status: 400 },);

    }
}


export async function updateChat(request: ExpressRequest, response: Response): Promise<Response> {
    await connectDB(process.env.MONGODB_URI!);
    try {
        const { sender, receiver, message, chatId } = await request.body;
        const chat = await Chat.findById(chatId);
        if (!chat) {
            logger.error("Chat not found");
            return response.json({ message: "Chat not found",status: 404 })};
        chat.allMessages.push(message);
        chat.messageCount += 1;
        chat.messageRemaining -= 1;
        if (chat.messageRemaining === 0) {
            logger.error("Message limit reached");
            return response.json({ message: "Message limit reached",status: 400  })};
        await chat.save();
        return response.json({
            message: "Message sent successfully",
            chat,
            status: 200
        });
    } catch (error: unknown) {
        logger.error("Error in sending message", {error});
        const message = error instanceof Error ? error.message : 'Unknown error';
        return response.json({ error: `Failed to send message:${message}`,status: 400 });
    }
}
export async function deleteChat(request: ExpressRequest, response: Response): Promise<Response> {
    await connectDB(process.env.MONGODB_URI!);
    try {
            const { chatId } = request.body;
       if (!chatId) {
        logger.warn("Chat ID is required");
      return response.status(400).json({
        success: false,
        message: "Chat ID is required",
      });
    }

  
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
        logger.warn("Invalid chat ID");
      return response.status(400).json({
        success: false,
        message: "Invalid chat ID",
      });
    }

   
    const deletedChat = await Chat.findOneAndDelete({
      _id: chatId,
      
    });

    if (!deletedChat) {
      logger.warn("Chat not found", { chatId });

      return response.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    logger.info("Chat deleted successfully", {
      chatId,
    });

    return response.status(200).json({
      success: true,
      message: "Chat deleted successfully",
    });
    } catch (error: unknown) {
        logger.error("Error in deleting chat",{error});
        const message = error instanceof Error ? error.message : 'Unknown error';
        return response.json({ error: `Failed to delete chat:${message}`,status: 400 });
    }
}