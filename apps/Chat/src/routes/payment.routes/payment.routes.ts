import crypto from 'crypto';
import Razorpay from 'razorpay';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@repo/shared';
import {User,Order,Course,Chat, Message, Payment } from '@repo/shared';

import { RazorpayCreateOrderRequest } from '@repo/shared';
import { IPaymentsByUser } from '@repo/shared';
import { logger } from "@repo/shared";
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});


export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        const { amount, chatId, messageLimit, userId } = await request.json();

        const user = await User.findOne({ _id: userId });
        if (!user) return NextResponse.json({ message: "User not found, Payment failed" }, { status: 404 });
        logger.info({ amount, chatId, userId }, "Payment initiation");
        logger.info({ messageLimit }, "Message limit value");
        // Verify Razorpay signature
        const shortReceipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const razorpayOptions: RazorpayCreateOrderRequest = {
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


        const razorpayChat = await razorpay.orders.create(razorpayOptions);
        chat.razorpayChatId = razorpayChat.id;
        chat.messageLimit = messageLimit;

        chat.paymentsByUser.push({ amount, paymentAt: new Date(), paymentBy: user._id!, paymentOf: chat._id } as IPaymentsByUser);
        await chat.save();
        const payment = new Payment({
            amount,
            paymentAt: new Date(),
            paymentBy: user._id!,
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

    } catch (error: any) {
        logger.error(error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error verifying payment:${message}`);
        return NextResponse.json({
            success: false,
            message: 'Payment verification failed',
            error: error.message
        }, { status: 500 });
    }
}