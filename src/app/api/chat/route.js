import { NextResponse } from "next/server"
import Razorpay from 'razorpay';
import { connectDB } from '@/config/db';
import User from '@/models/userModel';
import Course from '@/models/courseModel';
import { auth } from '@/auth';
import Chat from "@/models/chatModel";
import Message from "@/models/messageModel";

export async function GET(request) {
    await connectDB();
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;

        const chat = await Chat.find({sender:userId}).populate('sender','_id name profileImage').populate('receiver','_id name profileImage').populate('allMessages').lean();
        if (!chat) return NextResponse.json({ message: "Chat not found" }, { status: 404 });
        return NextResponse.json({
            message: "Chat found successfully",
            chat,

        }, { status: 200 });

    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Failed to find chat" }, { status: 400 });


    }
}


export async function POST(request) {
    await connectDB();
    try {
        let { sender, receiver } = await request.json();
       const existingChat = await Chat.find({ sender, receiver });
if (existingChat.length > 0)
  return NextResponse.json({ message: "Chat already Initialized" }, { status: 400 });
        receiver = '68324fcb722f7dcba7f82a32'
        console.log("This is the sender and receiver of chat :", sender, receiver);
        const chat = new Chat({ sender, receiver });
        await chat.save();
        return NextResponse.json({
            message: "Chat created successfully",
            chat
        }, { status: 200 });

    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Failed to create chat" }, { status: 400 });

    }
}


export async function PUT(request) {
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
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Failed to send message" }, { status: 400 });
    }
}
export async function DELETE(request) {
    await connectDB();
    try {
        const { chatId } = await request.json();
        const chat = await Chat.findByIdAndDelete(chatId);
        if (!chat) return NextResponse.json({ message: "Chat not found" }, { status: 404 });
        return NextResponse.json({
            message: "Chat deleted successfully",
            chat
        }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Failed to delete chat" }, { status: 400 });
    }
}