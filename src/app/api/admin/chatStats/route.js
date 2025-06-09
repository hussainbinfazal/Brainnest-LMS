import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Course from "@/models/courseModel";
import User from "@/models/userModel";
import { getDataFromToken } from "@/utils/getDataFromToken";
import Chat from "@/models/chatModel";
import Message from "@/models/messageModel";

export async function GET(request){
    try{
        await connectDB();
        const user = await getDataFromToken(request);
        const userId = user._id || user.id;
        const userInDB = await User.findById(userId);
        if(userInDB.role !== 'instructor') return NextResponse.json({message:"You are not authorized to access this route"},{status:401});
        const chats = await Chat.find({receiver:userId}).populate('paymentsByUser','amount paymentAt paymentBy').populate('paymentResult','status update_time email_address').populate('allMessages').lean();
        return NextResponse.json({chats},{status:200});

    }catch(error){
        return NextResponse.json({message:"There is a error on the server side"},{status:500})
    }
}