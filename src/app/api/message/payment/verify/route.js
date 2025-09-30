import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { connectDB } from '@/config/db';
import User from '@/models/userModel';
import Order from '@/models/orderModel';
import Course from '@/models/course/courseModel';
import Message from '@/models/messageModel';
import Chat from '@/models/chatModel';
export async function PUT(request) {


  try {
    await connectDB();

    const { chatId, paymentId, signature, sender, receiver, orderId, messageLimit } = await request.json();

    // Verify Razorpay signature
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === signature;

    if (!isAuthentic) {
      return NextResponse.json({
        success: false,
        message: 'Invalid payment signature'
      }, { status: 400 });
    }

    // Update chat in database
    const chat = await Chat.findById(chatId);

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

  } catch (error) {
    console.log(error)
    console.error('Error verifying payment:', error);
    return NextResponse.json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    }, { status: 500 });
  }
}