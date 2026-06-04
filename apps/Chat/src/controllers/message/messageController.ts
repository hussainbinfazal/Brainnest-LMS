import mongoose from "mongoose";
import { Request, response, Response } from "express";
import { ChatDocument, connectDB, logger, MessageDocument, validateMongooseId } from "@repo/shared";
import { Chat, Message } from "@repo/shared";


export async function sendMessage(request: Request, response: Response): Promise<Response> {
    try {
        await connectDB(process.env.MONGODB_URI!);
        const { messageData } = request.body;
        const { chatId, message, sender, receiver } = messageData;
        if (!message || !sender || !receiver || !chatId) return response.status(400).json({ message: "Missing required fields" });

        const [chatIdValid, senderValid, receiverValid] = await Promise.all([
            validateMongooseId({ chatId }),
            validateMongooseId({ userId: sender }),
            validateMongooseId({ userId: receiver }),
        ]);
        if (!chatIdValid || !senderValid || !receiverValid) {
            logger.warn("Invalid input data", { chatId, sender, receiver });
            return response.status(400).json({ message: "Invalid input data" });
        }
        const chatExists = await Chat.exists({ _id: chatId });
        if (!chatExists) {
            logger.warn("Chat not found", { chatId });
            return response.status(404).json({ message: "Chat not found" });
        }
        const newMessage: MessageDocument = new Message({ sender, receiver, message, senderType: "admin" });
        if (!newMessage) {
            logger.error("Failed to create message instance", { sender, receiver, message });
            return response.status(500).json({ message: "Failed to create message" });
        }
        await Promise.all([
            newMessage.save(),
            await Chat.findByIdAndUpdate(chatId, {
                $push: {
                    allMessages: newMessage._id
                }
            }, { new: true }).lean()
        ]);
        logger.info("Message sent successfully", { chatId, sender, receiver });
        return response.status(200).json({ message: "Message sent successfully" });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in Creating Message", { message });
        return response.status(500).json({ message: "Something went wrong" })
    }
}

export async function updateMessage(request: Request, response: Response): Promise<Response> {
    try {
        await connectDB(process.env.MONGODB_URI!);
        const { messageData } = request.body;
        const { messageId, chatId, message, sender, receiver } = messageData;
        if (!messageId || !message || !sender || !receiver || !chatId) return response.status(400).json({ message: "Missing required fields" });
        const [messageIdValid, chatIdValid, senderValid, receiverValid] = await Promise.all([
            validateMongooseId({ messageId: messageId }),
            validateMongooseId({ chatId }),
            validateMongooseId({ userId: sender }),
            validateMongooseId({ userId: receiver }),
        ]);
        if (!messageIdValid || !chatIdValid || !senderValid || !receiverValid) {
            logger.warn("Invalid input data", { messageId, chatId, sender, receiver });
            return response.status(400).json({ message: "Invalid input data" });
        }
        const messageInDB: MessageDocument | null = await Message.findByIdAndUpdate(messageId, { message }, { new: true });
        logger.info("Message updated Successfully", { messageId, chatId, sender, receiver });
        return response.status(200).
            json({ message: "Message updated successfully" });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in Updating Message", { message });
        return response.status(500).json({ message: `Error in Updating Message : ${message}` })
    }
}

export async function deleteMessage(request: Request, response: Response): Promise<Response> {
    await connectDB(process.env.MONGODB_URI!);
    const session = await mongoose.startSession();
    try {
        const { messageId, chatId } = request.body;
        if (!messageId) {
            logger.warn("Message ID is required");
            return response.status(400).json({ message: "Message id is required" })
        };
        if (!chatId) {
            logger.warn("Chat ID is required");
            return response.status(400).json({ message: "Chat id is required" })
        }
        const [messageValid, chatValid] = await Promise.all([
            validateMongooseId({ messageId }),
            validateMongooseId({ chatId })
        ]);

        if (!messageValid || !chatValid) {
            return response.status(400).json({
                message: "Invalid ids"
            });
        }
        
        session.startTransaction();
        const message: MessageDocument | null = await Message.findByIdAndDelete(messageId, { session });

        if (!message) {
            await session.abortTransaction();
            logger.warn("Message not found", { messageId });
            return response.status(404).json({
                message: "Message not found"
            });
        }


        const chat = await Chat.findByIdAndUpdate(
            chatId,
            {
                $pull: {
                    allMessages: messageId
                }
            }, { session, new: true }
        )
        if (!chat) {
            await session.abortTransaction();
            return response.status(404).json({
                message: "Chat not found"
            });
        }
        await session.commitTransaction();
        logger.info("Message deleted successfully", { messageId, chatId });
        return response.status(200).json({ message: "Message deleted successfully" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in deleting message", { message});
        await session.abortTransaction();
        return response.status(500).json({ message: `There is a error on the server side` })
    } finally {
        session.endSession();
    }
}