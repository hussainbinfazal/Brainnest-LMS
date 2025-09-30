import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import User from "@/models/userModel";
import Course from "@/models/course/courseModel";
import { getDataFromToken } from "@/utils/getDataFromToken";
import Chat from "@/models/chatModel";
import Message from "@/models/messageModel";
import { PiChatCircleDotsLight } from "react-icons/pi";

export async function POST(request) {
    try {
        await connectDB();
        const { messageData } = await request.json();
        const { chatId, message, sender, receiver } = messageData;
        if (!message || !sender || !receiver) return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        const newMessage = new Message({ sender, receiver, message, senderType: "admin" });
        const chatByMessage = await Chat.findById(chatId);
        if (!chatByMessage) return NextResponse.json({ message: "Chat not found" }, { status: 400 });
        chatByMessage.allMessages.push(newMessage);
        await newMessage.save();
        await chatByMessage.save();
        return NextResponse.json({ message: "Message sent successfully" }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        await connectDB();
        const { messageData } = await request.json();
        const { messageId, chatId, message, sender, receiver } = messageData;
        const messageInDB = await Message.findById(messageId);
        if (!messageInDB) return NextResponse.json({ message: "Message not found" }, { status: 404 });
        messageInDB.message = message;
        await messageInDB.save();
        return NextResponse.json({ message: "Message updated successfully" }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "There is a error on the server side" }, { status: 500 })
    }
}

export async function GET(request) {
    try {

    } catch (error) {
        return NextResponse.json({ message: "There is a error on the server side" }, { status: 500 })
    }
}


export async function DELETE(request) {
    try {
        await connectDB();
        const { messageId, chatId } = await request.json();
        if (!messageId) return NextResponse.json({ message: "Message id is required" }, { status: 400 });
        const message = await Message.findByIdAndDelete(messageId);
        if (!message) return NextResponse.json({ message: "Message not found" }, { status: 404 });

        const chatInDB = await Chat.findById(chatId);
        if (!chatInDB) return NextResponse.json({ message: "Chat not found" }, { status: 404 });
        chatInDB.allMessages.pull(messageId);

        await chatInDB.save();
        return NextResponse.json({ message: "Message deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "There is a error on the server side" }, { status: 500 })
    }
}