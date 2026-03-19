import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/mongoDB/db";
import User from "@/models/User/userModel";
import { getDataFromToken } from "@/utils/getDataFromToken";
import Chat from "@/models/Chat/chatModel";
import { IChat, IUser } from "@/types/model";
import { ISessionUser } from "@/types/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();
        const user: ISessionUser | null = await getDataFromToken(request);
        const userId: string | null = user?.id || "";
        const userInDB: IUser | null = await User.findById(userId);
        if (userInDB?.role !== 'instructor') return NextResponse.json({ message: "You are not authorized to access this route" }, { status: 401 });
        const chats: IChat[] | null = await Chat.find({ receiver: userId }).populate('paymentsByUser', 'amount paymentAt paymentBy').populate('paymentResult', 'status update_time email_address').populate('allMessages').lean();
        return NextResponse.json({ chats }, { status: 200 });

    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `Error in getting chat stats:${message}` }, { status: 500 })
    }
}