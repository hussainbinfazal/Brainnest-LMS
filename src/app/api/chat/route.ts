import { NextRequest, NextResponse } from "next/server"
import Razorpay from 'razorpay';
import { connectDB } from '@/config/mongoDB/db';
import User from '@/models/User/userModel';
import Course from '@/models/Course/courseModel';
import { auth } from '@/auth';
import Chat from "@/models/Chat/chatModel";
import Message from "@/models/Chat/messageModel";
import { IChat } from "@/types/model";
import { logger } from "@/utils/logger/logger.node";

export async function GET(request: NextRequest): Promise<NextResponse> {
    await connectDB();
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const userId: string = session.user.id;

        const chat: IChat[] = await Chat.find({ sender: userId }).populate('sender', '_id name profileImage').populate('receiver', '_id name profileImage').populate('allMessages').lean();
        if (!chat) return NextResponse.json({ message: "Chat not found" }, { status: 404 });
        return NextResponse.json({
            message: "Chat found successfully",
            chat,

        }, { status: 200 });

    } catch (error: any) {
        logger.error(error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: `Failed to find chat: ${message}` }, { status: 400 });


    }
}


export async function POST(request: NextRequest): Promise<NextResponse> {
    await connectDB();
    try {
        let { sender, receiver } = await request.json();
        const existingChat = await Chat.find({ sender, receiver });
        if (existingChat.length > 0)
            return NextResponse.json({ message: "Chat already Initialized" }, { status: 400 });
        receiver = '68324fcb722f7dcba7f82a32'
        logger.info({ sender, receiver }, "This is the sender and receiver of chat");
        const chat = new Chat({ sender, receiver });
        await chat.save();
        return NextResponse.json({
            message: "Chat created successfully",
            chat
        }, { status: 200 });

    } catch (error: any) {
        logger.error(error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: `Error in creating chat: ${message}` }, { status: 400 });

    }
}


export async function PUT(request: NextRequest): Promise<NextResponse> {
    await connectDB();
    try {
        const { sender, receiver, message, chatId } = await request.json();
        const chat = await Chat.findById(chatId);
        if (!chat) return NextResponse.json({ message: "Chat not found" }, { status: 404 });
        chat.allMessages.push(message);
        chat.messageCount += 1;
        chat.messageRemaining -= 1;
        if (chat.messageRemaining === 0) return NextResponse.json({ message: "Message limit reached" }, { status: 400 });
        await chat.save();
        return NextResponse.json({
            message: "Message sent successfully",
            chat
        }, { status: 200 });
    } catch (error: any) {
        logger.error(error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: `Failed to send message:${message}` }, { status: 400 });
    }
}
export async function DELETE(request: NextRequest): Promise<NextResponse> {
    await connectDB();
    try {
        const { chatId } = await request.json();
        const chat = await Chat.findByIdAndDelete(chatId);
        if (!chat) return NextResponse.json({ message: "Chat not found" }, { status: 404 });
        return NextResponse.json({
            message: "Chat deleted successfully",
            chat
        }, { status: 200 });
    } catch (error: any) {
        logger.error(error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: `Failed to delete chat:${message}` }, { status: 400 });
    }
}