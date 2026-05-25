import { Request, Response } from "express";
import { connectDB } from '@repo/shared';
import {Chat} from "@repo/shared";
import { ISessionUser } from "@repo/shared";




export async function GET(request: Request): Promise<Response> {
    try {
        const admin: ISessionUser | null = await getDataFromToken(request);
        const adminId = admin?.id;
        await connectDB(process.env.MONGODB_URI);
        const chatOfAdmins = await Chat.find(({ receiver: adminId })).populate('receiver', 'name profileImage').populate('sender', 'name profileImage').populate('paymentResult', 'status update_time email_address').populate('paymentsByUser', 'amount paymentAt paymentBy').populate('allMessages').lean();
        if (!chatOfAdmins) return NextResponse.json({ message: "Chat not found" }, { status: 404 });
        return NextResponse.json({ message: "Chat found successfully", chatOfAdmins }, { status: 200 });
    } catch (error: any) {
        console.log("There is a error on the server side", error)
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `Error in finding chat: ${message}` }, { status: 500 })
    }
}
