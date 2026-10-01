import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/config/mongoDB/db';
import User from '@/models/User/userModel';
import Order from '@/models/Cart/orderModel';
import Course from '@/models/Course/courseModel';
import Chat from '@/models/Chat/chatModel';
import Message from '@/models/Chat/messageModel';
import Payment from "@/models/Payment/paymentModel"
import { RazorpayCreateOrderRequest } from '@/types/server';
import { IPaymentsByUser } from '@/types/model';
import { logger } from "@/utils/logger/logger.node";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";

const initiateChatPaymentBodySchema = z.object({
    amount: z.number().positive(),
    chatId: z.string(),
    messageLimit: z.any(),
    userId: z.string(),
});
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});


export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        const body = await parseBody(request, initiateChatPaymentBodySchema);
        if (!body.ok) return body.response;
        const { amount, chatId, messageLimit, userId } = body.data;

        const user = await User.findOne({ _id: userId });
        if (!user) return failResponse({ message: "User not found, Payment failed" }, 404, undefined, undefined, true);
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
            return failResponse({
                success: false,
                message: 'Chat not found'
            }, 404, undefined, undefined, true);
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
        return successResponse({
            success: true,
            message: 'Payment verified successfully',
            razorpayChatId: razorpayChat.id,
            chat: chat._id,
            amount: amount
        }, 200, undefined, undefined, true);

    } catch (error: any) {
        logger.error(error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error verifying payment:${message}`);
        return failResponse({
            success: false,
            message: 'Payment verification failed',
            error: error.message
        }, 500, undefined, undefined, true);
    }
}