import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/mongoDB/db";

import Chat from "@/models/Chat/chatModel";
import Message from "@/models/Chat/messageModel";
import { IChat, IMessage } from "@/types/model";
;
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";

const createMessageBodySchema = z.object({
    messageData: z.object({
        chatId: z.string().optional(),
        message: z.string().optional(),
        sender: z.string().optional(),
        receiver: z.string().optional(),
    }).passthrough(),
});
const deleteMessageBodySchema = z.object({ messageId: z.string() });
const updateMessageBodySchema = z.object({
    messageId: z.string(),
    isRead: z.boolean().optional(),
    isDeletedByReceiver: z.boolean().optional(),
    isDeletedBySender: z.boolean().optional(),
});

export async function POST(request: NextRequest, context: { params: { userId: string } }): Promise<NextResponse> {
    try {
        await connectDB(process);
        const body = await parseBody(request, createMessageBodySchema);
        if (!body.ok) return body.response;
        const { messageData } = body.data;
        const { chatId, message, sender, receiver } = messageData;
        if (!message || !sender || !receiver) {
            return failResponse({ error: "Missing required fields" }, 400, undefined, undefined, true);
        }
        const newMessage: IMessage | null = new Message({
            sender,
            receiver,
            message
        });
        const chatByMessage: IChat | null = await Chat.findById(chatId);
        if (!chatByMessage) {
            return failResponse({ error: "Chat not found" }, 404, undefined, undefined, true);
        }

        if (chatByMessage.messageCount === chatByMessage.messageLimit) {
            chatByMessage.isLimitExceeded = true;
            chatByMessage.isActive = false;

            return failResponse({ message: "Message limit reached" }, 400, undefined, undefined, true);
        }
        chatByMessage.messageCount += 1;
        chatByMessage.messageRemaining -= 1;
        chatByMessage.allMessages.push(newMessage);
        await newMessage?.save();


        await chatByMessage.save();

        return successResponse({ message: "Message sent successfully" }, 200, undefined, undefined, true);
    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error in message creation:${message}`);
        return failResponse({ error: "Internal Server Error" }, 500, undefined, undefined, true);
    }
}


export async function GET(request: NextRequest, context: { params: { skip: string, limit: string } }): Promise<NextResponse> {
    try {
        await connectDB();
        const skip: number = parseInt(context.params.skip) || 0;
        const limit: number = parseInt(context.params.limit) || 10;
        const messages: IMessage[] = await Message.find().skip(skip).limit(limit);
        return successResponse({ messages }, 200, undefined, undefined, true);


    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Internal Server Error:${message}`, error);
        return failResponse({ error: "Internal Server Error" }, 500, undefined, undefined, true);
    }
}

export async function DELETE(request: NextRequest, context: { params: { userId: string } }): Promise<NextResponse> {
    try {
        await connectDB();
        const body = await parseBody(request, deleteMessageBodySchema);
        if (!body.ok) return body.response;
        const { messageId } = body.data;
        if (!messageId) {
            return failResponse({ error: "Message ID is required" }, 400, undefined, undefined, true);
        }
        const deletedMessage: IMessage | null = await Message.findByIdAndDelete(messageId);
        if (!deletedMessage) {
            return failResponse({ error: "Message not found" }, 404, undefined, undefined, true);
        }
        return successResponse({ message: "Message deleted successfully" }, 200, undefined, undefined, true);
    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error in DELETE :${message}`);
        return failResponse({ error: "Internal Server Error" }, 500, undefined, undefined, true);
    }
}

export async function PUT(request: NextRequest, context: { params: { userId: string } }): Promise<NextResponse> {
    try {
        await connectDB();
        const body = await parseBody(request, updateMessageBodySchema);
        if (!body.ok) return body.response;
        const { messageId, isRead, isDeletedByReceiver, isDeletedBySender } = body.data;
        if (!messageId) {
            return failResponse({ error: "Message ID is required" }, 400, undefined, undefined, true);
        }
        const updatedMessage: IMessage | null = await Message.findByIdAndUpdate(
            messageId,
            { isRead, isDeletedByReceiver, isDeletedBySender },
            { new: true }
        );
        if (!updatedMessage) {
            return failResponse({ error: "Message not found" }, 404, undefined, undefined, true);
        }
        return successResponse({ message: "Message updated successfully", updatedMessage }, 200, undefined, undefined, true);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return failResponse({ error: `Internal Server Error : ${message}` }, 500, undefined, undefined, true);
    }
}