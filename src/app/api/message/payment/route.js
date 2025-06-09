import crypto from 'crypto';
import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import { connectDB } from '@/config/db';
import User from '@/models/userModel';
import Order from '@/models/orderModel';
import Course from '@/models/courseModel';
import Chat from '@/models/chatModel';
import Message from '@/models/messageModel';
import Payment from "@/models/paymentModel"
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


export async function PUT(request) {


    try {
        await connectDB();

        const { amount, chatId, messageLimit, userId } = await request.json();

        console.log("This is the amount :", amount);
        console.log("This is the messageLimit :", messageLimit);
        // Verify Razorpay signature
        const shortReceipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const razorpayOptions = {
            amount: amount * 100, // Convert to paisa
            currency: 'INR',
            receipt: shortReceipt
        };
        const chat = await Chat.findOne({ _id: chatId });

        if (!chat) {
            return NextResponse.json({
                success: false,
                message: 'Chat not found'
            }, { status: 404 });
        }

        const user = await User.findOne({ _id: userId });
        const razorpayChat = await razorpay.orders.create(razorpayOptions);
        chat.razorpayChatId = razorpayChat.id;
        chat.messageLimit = messageLimit;
        chat.paymentsByUser.push({ amount: amount, paymentAt: new Date(), paymentBy: user._id, paymentOf: chat._id });
        await chat.save();
        const payment = new Payment({
            amount,
            paymentAt: new Date(),
            paymentBy: user._id,
            paymentId: razorpayChat.id,
            paymentOf: chat._id,
            paymentOnModel: 'Chat',
        });

        await payment.save();
        return NextResponse.json({
            success: true,
            message: 'Payment verified successfully',
            razorpayChatId: razorpayChat.id,
            chat: chat._id,
            amount: amount
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