import mongoose from "mongoose";
import { Request, response, Response } from "express";
import { ChatDocument, connectDB, IMessage, logger, MessageDocument, validateMongooseId } from "@repo/shared";
import { Chat, Message } from "@repo/shared";


export async function generateNewMessage(request: Request, response: Response): Promise<Response> {
    await connectDB(process.env.MONGODB_URI!);
    const session = await mongoose.startSession();
    try {
        const { messageData } = request.body;
        const { chatId, message, sender, receiver, senderType } = messageData;
        if (!message || !sender || !receiver || !chatId || !senderType) return response.status(400).json({ message: "Missing required fields" });

        const [chatIdValid, senderValid, receiverValid] = await Promise.all([
            validateMongooseId({ chatId }),
            validateMongooseId({ userId: sender }),
            validateMongooseId({ userId: receiver }),
        ]);
        if (!chatIdValid || !senderValid || !receiverValid) {
            logger.warn("Invalid input data", { chatId, sender, receiver });
            return response.status(400).json({ message: "Invalid input data" });
        };
        const newMessage: MessageDocument = new Message({ sender, receiver, message, senderType: senderType });


        await session.withTransaction(async (): Promise<void> => {
            const updatedChat: ChatDocument | null = await Chat.findOneAndUpdate(
                {
                    _id: chatId,
                    isActive: true,
                    isLimitExceeded: false,
                    $expr: {
                        $lt: ["$messageCount", "$messageLimit"],
                    },
                },
                {
                    $push: {
                        allMessages: newMessage._id,
                    },
                    $inc: {
                        messageCount: 1,
                        messageRemaining: -1,
                    },
                },
                {
                    new: true,
                    session,
                }
            );

            if (!updatedChat) {
                throw new Error(
                    "Chat not found, inactive, or message limit exceeded"
                );
            }

            // Last allowed message reached the limit
            if (
                updatedChat.messageCount >= updatedChat.messageLimit
            ) {
                updatedChat.isActive = false;
                updatedChat.isLimitExceeded = true;

                await updatedChat.save({ session });
            }

            await newMessage.save({ session });
        });


        logger.info("Message sent successfully", { chatId, sender, receiver });
        return response.status(200).json({ message: "Message sent successfully" });

    } catch (error: unknown) {
        const message: string =
            error instanceof Error
                ? error.message
                : "Unknown error";

        logger.error("Error creating message", {
            message,
        });

        if (
            message.includes("message limit exceeded") ||
            message.includes("inactive") ||
            message.includes("Chat not found")
        ) {
            return response.status(400).json({
                message,
            });
        }

        return response.status(500).json({
            message: "Something went wrong",
        });
    } finally {
        await session.endSession();
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
        };
        if (message.length === 0) {
            logger.warn("Message content cannot be empty", { messageId, chatId });
            return response.status(400).json({ message: "Message content cannot be empty" });
        };
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
        logger.error("Error in deleting message", { message });
        await session.abortTransaction();
        return response.status(500).json({ message: `There is a error on the server side` })
    } finally {
        session.endSession();
    }
}
export async function getAllMessages(request: Request, response: Response): Promise<Response> {
    try {
        await connectDB(process.env.MONGODB_URI!);
        const skip: number = parseInt(request.params.skip.toString()) || 0;
        const limit: number = parseInt(request.params.limit.toString()) || 10;
        const messages: IMessage[] = await Message.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
        logger.info("All Messages fetched Successfully")
        return response
            .status(200)
            .json({
                message: "All Messages fetched Successfully", messages
            });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Internal Server Error`, { message });
        return response
            .status(500)
            .json({ error: "Internal Server Error" });
    }
}