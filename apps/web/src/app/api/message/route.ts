import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/mongoDB/db";

import Chat from "@/models/Chat/chatModel";
import Message from "@/models/Chat/messageModel";
import { IChat, IMessage } from "@/types/model";
;

export async function POST(request: NextRequest, context: { params: { userId: string } }): Promise<NextResponse> {
    try {
        await connectDB();
        const { messageData } = await request.json()
        const { chatId, message, sender, receiver } = messageData;
        if (!message || !sender || !receiver) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        const newMessage: IMessage | null = new Message({
            sender,
            receiver,
            message
        });
        const chatByMessage: IChat | null = await Chat.findById(chatId);
        if (!chatByMessage) {
            return NextResponse.json({ error: "Chat not found" }, { status: 404 });
        }

        if (chatByMessage.messageCount === chatByMessage.messageLimit) {
            chatByMessage.isLimitExceeded = true;
            chatByMessage.isActive = false;

            return NextResponse.json({ message: "Message limit reached" }, { status: 400 });
        }
        chatByMessage.messageCount += 1;
        chatByMessage.messageRemaining -= 1;
        chatByMessage.allMessages.push(newMessage);
        await newMessage?.save();


        await chatByMessage.save();

        return NextResponse.json({ message: "Message sent successfully" }, { status: 200 });
    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error in message creation:${message}`);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


export async function GET(request: NextRequest, context: { params: { skip: string, limit: string } }): Promise<NextResponse> {
    try {
        await connectDB();
        const skip: number = parseInt(context.params.skip) || 0;
        const limit: number = parseInt(context.params.limit) || 10;
        const messages: IMessage[] = await Message.find().skip(skip).limit(limit);
        return NextResponse.json({ messages }, { status: 200 });


    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Internal Server Error:${message}`, error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: { params: { userId: string } }): Promise<NextResponse> {
    try {
        await connectDB();
        const { messageId } = await request.json();
        if (!messageId) {
            return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
        }
        const deletedMessage: IMessage | null = await Message.findByIdAndDelete(messageId);
        if (!deletedMessage) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }
        return NextResponse.json({ message: "Message deleted successfully" }, { status: 200 });
    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error in DELETE :${message}`);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, context: { params: { userId: string } }): Promise<NextResponse> {
    try {
        await connectDB();
        const { messageId, isRead, isDeletedByReceiver, isDeletedBySender } = await request.json();
        if (!messageId) {
            return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
        }
        const updatedMessage: IMessage | null = await Message.findByIdAndUpdate(
            messageId,
            { isRead, isDeletedByReceiver, isDeletedBySender },
            { new: true }
        );
        if (!updatedMessage) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }
        return NextResponse.json({ message: "Message updated successfully", updatedMessage }, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: `Internal Server Error : ${message}` }, { status: 500 });
    }
}