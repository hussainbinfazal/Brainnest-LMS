
import { Request, Response } from "express";
import Razorpay from 'razorpay';
import { connectDB } from '@repo/shared';
import { User, Chat, Course, Message, Payment } from "@repo/shared";
import { RazorpayCreateOrderRequest } from '@repo/shared';
import { IPaymentsByUser } from '@repo/shared';
import { logger } from "@repo/shared";
import mongoose from 'mongoose';

const razorpay: Razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});


export async function createChatPaymentOrder(request: Request, response: Response): Promise<Response> {
    await connectDB(process.env.MONGODB_URI!);
    const session = await mongoose.startSession();

    try {
        const { amount, chatId, messageLimit, userId } = request.body;
        if (!amount || !chatId || !userId || !messageLimit) {
            logger.warn("Missing required fields", { amount, chatId, userId, messageLimit });
            return response.status(400).json({ message: "User not found, Payment failed" });;
        }
        if (amount <= 0) {
            logger.warn("Invalid amount", { amount });
            return response.status(400).json({
                message: "Invalid amount"
            });
        }
        await session.withTransaction(async () => {

            const [user, chat] = await Promise.all([
                User.findById(userId).session(session),
                Chat.findById(chatId).session(session)
            ]);

            if (!user) {
                logger.warn("User not found", { userId });
                return response.status(404).json({
                    message: "User not found"
                });
            }

            if (!chat) {
                logger.warn("Chat not found", { chatId });
                return response.status(404).json({
                    message: "Chat not found"
                });
            }

            logger.info(
                "Payment initiation",
                { amount, chatId, userId },
            );

            const shortReceipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            const razorpayOptions: RazorpayCreateOrderRequest = {
                amount: amount * 100, // Convert to paisa
                currency: 'INR',
                receipt: shortReceipt
            };
            const razorpayOrder =
                await razorpay.orders.create(razorpayOptions);

            chat.paymentsByUser.push({
                amount,
                paymentAt: new Date(),
                paymentBy: user._id,
                paymentOf: chat._id
            } as IPaymentsByUser);

            await chat.save({ session });

            const payment = new Payment({
                paymentBy: user._id,
                paymentOf: chat._id,
                paymentOnModel: 'Chat',
                paymentStatus: "pending"
            });

            await payment.save({ session });

            response.locals.paymentResult = {
                success: true,
                paymentId: razorpayOrder.id,
                razorpayChatId: razorpayOrder.id,
                chatId: chat._id,
                amount
            };
        });
        return response.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            ...response.locals.paymentResult
        });

    } catch (error: unknown) {
        logger.error(" Error Processing payment", { error });
        const message = error instanceof Error ? error.message : 'Unknown error';

        return response.status(500).json({
            success: false,
            message: "Payment order created successfully",
            error: message
        });
    } finally {
        await session.endSession();
    }
}