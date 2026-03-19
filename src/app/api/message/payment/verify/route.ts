import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/config/mongoDB/db';
import User from '@/models/User/userModel';
import Order from '@/models/Cart/orderModel';
import Course from '@/models/Course/courseModel';
import Message from '@/models/Chat/messageModel';
import Chat from '@/models/Chat/chatModel';
import { IChat } from '@/types/model';
import { logger } from "@/utils/logger/logger";
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();

    const { chatId, paymentId, signature, sender, receiver, orderId, messageLimit } = await request.json();

    // Verify Razorpay signature
    const body: string = orderId + '|' + paymentId;
    const expectedSignature: string = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');

    const isAuthentic: boolean = expectedSignature === signature;

    if (!isAuthentic) {
      return NextResponse.json({
        success: false,
        message: 'Invalid payment signature'
      }, { status: 400 });
    }

    // Update chat in database
    const chat: IChat | null = await Chat.findById(chatId);

    if (!chat) {
      return NextResponse.json({
        success: false,
        message: 'Order not found'
      }, { status: 404 });
    }

    chat.isPaid = true;
    chat.paidAt = new Date();
    chat.paymentResult = {
      id: paymentId,
      status: 'completed',
      update_time: new Date().toISOString()
    };
    chat.isLimitExceeded = false;
    chat.isActive = true;
    chat.isRenewed = true;
    chat.sender = sender;
    chat.receiver = receiver;
    chat.totalInterval += 1; // Update interval as needed

    chat.messageRemaining = chat.messageLimit;
    chat.messageCount = 0;

    await chat.save();

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      chatId: chat._id

    }, { status: 200 });

  } catch (error: any) {
    logger.error(error)
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      message: `Payment verification failed:${message}`,
      error: error.message
    }, { status: 500 });
  }
}