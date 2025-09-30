import { NextResponse } from "next/server"
import Razorpay from 'razorpay';
import { connectDB } from '@/config/db';
import User from '@/models/userModel';
import Course from '@/models/course/courseModel';
import { getDataFromToken } from '@/utils/getDataFromToken';
import Chat from "@/models/chatModel";








export async function GET(request, context) {
    await connectDB();
    try {
        const { userId } = await context.params;
        // console.log("This is the user Id", userId);
        const chat = await Chat.findOne({ sender: userId }).lean();
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