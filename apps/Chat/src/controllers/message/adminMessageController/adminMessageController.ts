// import { NextRequest, NextResponse } from "next/server";
// import { connectDB } from "@repo/shared";
// import {Chat,Message,IChat, IMessage} from "@repo/shared";
// import mongoose from "mongoose";

// export async function POST(request: Request, response: Response): Promise<Response> {
//     try {
//         await connectDB(process.env.MONGODB_URI!);
//         const { messageData } =  request.body;
//         const { chatId, message, sender, receiver } = messageData;
//         if (!message || !sender || !receiver) return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
//         const newMessage: IMessage | null = new Message({ sender, receiver, message, senderType: "admin" });
//         const chatByMessage: IChat | null = await Chat.findById(chatId);
//         if (!chatByMessage) return NextResponse.json({ message: "Chat not found" }, { status: 400 });
//         chatByMessage.allMessages.push(newMessage._id);
//         await newMessage.save();
//         await chatByMessage.save();
//         return NextResponse.json({ message: "Message sent successfully" }, { status: 200 });

//     } catch (error: any) {
//         const message = error instanceof Error ? error.message : 'Unknown error';
//         console.error(`Error in Creating Message :${message}`);
//         return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
//     }
// }

// export async function PUT(request: NextRequest): Promise<NextResponse> {
//     try {
//         await connectDB();
//         const { messageData } = await request.json();
//         const { messageId, chatId, message, sender, receiver } = messageData;
//         const messageInDB: IMessage | null = await Message.findById(messageId);
//         if (!messageInDB) return NextResponse.json({ message: "Message not found" }, { status: 404 });
//         messageInDB.message = message;
//         await messageInDB.save();
//         return NextResponse.json({ message: "Message updated successfully" }, { status: 200 });

//     } catch (error: any) {
//         const message = error instanceof Error ? error.message : 'Unknown error';
//         return NextResponse.json({ message: `Error in Updating Message : ${message}` }, { status: 500 })
//     }
// }

// export async function DELETE(request: NextRequest): Promise<NextResponse> {
//     try {
//         await connectDB();
//         const { messageId, chatId } = await request.json();
//         if (!messageId) return NextResponse.json({ message: "Message id is required" }, { status: 400 });
//         const message: IMessage | null = await Message.findByIdAndDelete(messageId);
//         if (!message) return NextResponse.json({ message: "Message not found" }, { status: 404 });

//         const chatInDB: IChat | null = await Chat.findById(chatId);
//         if (!chatInDB) return NextResponse.json({ message: "Chat not found" }, { status: 404 });
//         const objectMessageId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(messageId);
//         chatInDB.allMessages.pull(objectMessageId);

//         await chatInDB.save();
//         return NextResponse.json({ message: "Message deleted successfully" }, { status: 200 });
//     } catch (error: any) {
//         const message = error instanceof Error ? error.message : 'Unknown error';
//         return NextResponse.json({ message: `There is a error on the server side:${message}` }, { status: 500 })
//     }
// }