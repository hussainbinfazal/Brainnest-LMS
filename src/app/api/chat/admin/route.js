

import { NextResponse } from "next/server"
import Razorpay from 'razorpay';
import { connectDB } from '@/config/db';
import User from '@/models/userModel';
import Course from '@/models/courseModel';
import { getDataFromToken } from '@/utils/getDataFromToken';
import Chat from "@/models/chatModel";
import Message from "@/models/messageModel";


export async function POST(request) {
    try {

    } catch (error) {
        return NextResponse.json({ message: "There is a error on the server side" }, { status: 500 })
    }
}

export async function GET(request, context) {
    try {
        const admin = await getDataFromToken(request);
        const adminId = admin._id || admin.id;
        await connectDB();
        const chatOfAdmins = await Chat.find(({ receiver: adminId })).populate('receiver', 'name profileImage').populate('sender', 'name profileImage').populate('paymentResult', 'status update_time email_address').populate('paymentsByUser', 'amount paymentAt paymentBy').populate('allMessages').lean();
        if (!chatOfAdmins) return NextResponse.json({ message: "Chat not found" }, { status: 404 });
        return NextResponse.json({ message: "Chat found successfully", chatOfAdmins }, { status: 200 });



    } catch (error) {
        console.log("There is a error on the server side", error)
        return NextResponse.json({ message: "There is a error on the server side" }, { status: 500 })
    }
}


export async function PUT(request, context) {
    try {

    } catch (error) {
        return NextResponse.json({ message: "There is a error on the server side" }, { status: 500 })
    }
}