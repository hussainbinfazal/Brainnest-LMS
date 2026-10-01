import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextRequest, NextResponse } from "next/server";
import { connectDB, validateMongooseId } from '@repo/shared/server';
import { Chat, Message } from '@repo/shared/server';
import { IChat, IMessage } from '@repo/shared/server';
import mongoose from "mongoose";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";

const adminMessageBodySchema = z.object({
    messageData: z.record(z.string(), z.any()),
});
const deleteAdminMessageBodySchema = z.object({ messageId: z.string(), chatId: z.string() });

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        await connectDB(process.env.MONGODB_URI!);
        const body = await parseBody(request, adminMessageBodySchema);
        if (!body.ok) return body.response;
        const { messageData } = body.data;
        const { chatId, message, sender, receiver } = messageData;
        if(validateMongooseId({ chatId:chatId }) === false) return failResponse({ message: "Invalid ids" }, 400, undefined, undefined, true);
        if (!message || !sender || !receiver) return failResponse({ message: "Missing required fields" }, 400, undefined, undefined, true);
        const [newMessage, chatByMessage] = await Promise.all([
            new Message({ sender, receiver, message, senderType: "admin" }).save(),
            Chat.findById(chatId)       
        ]);
        const newMessage: IMessage | null = new Message({ sender, receiver, message, senderType: "admin" });
        const chatByMessage: IChat | null = await Chat.findById(chatId);
        if (!chatByMessage) return failResponse({ message: "Chat not found" }, 400, undefined, undefined, true);
        chatByMessage.allMessages.push(newMessage._id);
        await newMessage.save();
        await chatByMessage.save();
        return successResponse({ message: "Message sent successfully" }, 200, undefined, undefined, true);

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error in Creating Message :${message}`);
        return failResponse({ message: "Something went wrong" }, 500, undefined, undefined, true)
    }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();
        const body = await parseBody(request, adminMessageBodySchema);
        if (!body.ok) return body.response;
        const { messageData } = body.data;
        const { messageId, chatId, message, sender, receiver } = messageData;
        const messageInDB: IMessage | null = await Message.findById(messageId);
        if (!messageInDB) return failResponse({ message: "Message not found" }, 404, undefined, undefined, true);
        messageInDB.message = message;
        await messageInDB.save();
        return successResponse({ message: "Message updated successfully" }, 200, undefined, undefined, true);

    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return failResponse({ message: `Error in Updating Message : ${message}` }, 500, undefined, undefined, true)
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();
        const body = await parseBody(request, deleteAdminMessageBodySchema);
        if (!body.ok) return body.response;
        const { messageId, chatId } = body.data;
        if (!messageId) return failResponse({ message: "Message id is required" }, 400, undefined, undefined, true);
        const message: IMessage | null = await Message.findByIdAndDelete(messageId);
        if (!message) return failResponse({ message: "Message not found" }, 404, undefined, undefined, true);

        const chatInDB: IChat | null = await Chat.findById(chatId);
        if (!chatInDB) return failResponse({ message: "Chat not found" }, 404, undefined, undefined, true);
        const objectMessageId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(messageId);
        chatInDB.allMessages.pull(objectMessageId);

        await chatInDB.save();
        return successResponse({ message: "Message deleted successfully" }, 200, undefined, undefined, true);
    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return failResponse({ message: `There is a error on the server side:${message}` }, 500, undefined, undefined, true)
    }
}