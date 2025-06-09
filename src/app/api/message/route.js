import { NextResponse } from "next/server";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { connectDB } from "@/config/db";
import Course from "@/models/courseModel";
import User from "@/models/userModel";
import Chat from "@/models/chatModel";
import Message from "@/models/messageModel";
;

export async function POST(request, context) {
    try {
        await connectDB();
        const { messageData } = await request.json()
        const { chatId, message, sender, receiver } = messageData;
        if (!message || !sender || !receiver) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        const newMessage = new Message({
            sender,
            receiver,
            message
        });
        const chatByMessage = await Chat.findById(chatId);
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
        await newMessage.save();


        await chatByMessage.save();

        return NextResponse.json({ message: "Message sent successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error in POST /api/message:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


export async function GET(request, context) {
    try {
        await connectDB();
        const skip = parseInt(context.params.skip) || 0;
        const limit = parseInt(context.params.limit) || 10;
        const messages = await Message.find().skip(skip).limit(limit);
        return NextResponse.json({ messages }, { status: 200 });


    } catch (error) {
        console.error("Error in GET /api/message:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request, context) {
    try {
        await connectDB();
        const { messageId } = await request.json();
        if (!messageId) {
            return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
        }
        const deletedMessage = await Message.findByIdAndDelete(messageId);
        if (!deletedMessage) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }
        return NextResponse.json({ message: "Message deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error in DELETE /api/message:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request, context) {
    try {
        await connectDB();
        const { messageId, isRead, isDeletedByReceiver, isDeletedBySender } = await request.json();
        if (!messageId) {
            return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
        }
        const updatedMessage = await Message.findByIdAndUpdate(
            messageId,
            { isRead, isDeletedByReceiver, isDeletedBySender },
            { new: true }
        );
        if (!updatedMessage) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }
        return NextResponse.json({ message: "Message updated successfully", updatedMessage }, { status: 200 });
    } catch (error) {

    }
}