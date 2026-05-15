import { NextRequest, NextResponse } from "next/server"
import Razorpay from 'razorpay';
import { connectDB } from '@/config/mongoDB/db';
import User from '@/models/User/userModel';
import Course from '@/models/Course/courseModel';
import { getDataFromToken } from '@/utils/getDataFromToken';
import Chat from "@/models/Chat/chatModel";
import { IChat } from "@/types/model";

export async function GET(request: NextRequest, context: { params: { userId: string } }): Promise<NextResponse> {
    await connectDB();
    try {
        const { userId } = await context.params;
        // console.log("This is the user Id", userId);
        const chat: IChat | null = await Chat.findOne({ sender: userId }).lean();
        if (!chat) return NextResponse.json({ message: "Chat not found" }, { status: 404 });
        return NextResponse.json({
            message: "Chat found successfully",
            chat,

        }, { status: 200 });

    } catch (error: any) {
        console.log(error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: `Error in finding chat: ${message}` }, { status: 400 });


    }
}