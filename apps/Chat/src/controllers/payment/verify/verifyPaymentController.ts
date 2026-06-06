import crypto from 'crypto';
import { Request, Response } from 'express';
import { connectDB, Payment } from '@repo/shared';
import { User, Course, Message, Chat, IChat } from '@repo/shared';
import { logger } from "@repo/shared";
import mongoose from 'mongoose';
export async function verifyChatPayment(request: Request, response: Response): Promise<Response> {
    await connectDB(process.env.MONGODB_URI!);
    const session = await mongoose.startSession();
    try {

        const { chatId, paymentId, signature, orderId, messageLimit } = request.body;

        // Verify Razorpay signature
        const body: string = orderId + '|' + paymentId;
        const expectedSignature: string = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body.toString())
            .digest('hex');

        const isAuthentic: boolean = expectedSignature === signature;

        if (!isAuthentic) {
            return response.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }
        await session.withTransaction(async () => {
            const [payment, chat] = await Promise.all([
                Payment.findOne({
                    paymentId,
                    paymentStatus: "pending"
                }).session(session),
                Chat.findById(chatId).session(session)
            ]);

            if (!payment) {
                logger.warn("Payment not found", { orderId, paymentId });
                throw new Error("Payment not found");
            }
            if (!chat) {
                logger.warn("Chat not found", { chatId });
                throw new Error("Chat not found");
                ;
            }
            
            if (!messageLimit || messageLimit <= 0) {
                logger.warn("Invalid message limit", { messageLimit });
                throw new Error("Invalid message limit");
            }

            payment.paymentStatus = "completed";
            payment.paymentId = paymentId;
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
            chat.totalInterval += 1; // Update interval as needed
            chat.messageRemaining = messageLimit;
            chat.messageLimit = messageLimit;
            chat.messageCount = 0;
            await Promise.all([
                payment.save({ session }),
                chat.save({ session })
            ]);

        });
        // Update chat in database
        return response.status(200).json({
            success: true,
            message: "Payment verified successfully",
            chatId: chatId,
            paymentId
        });

    } catch (error: unknown) {
        logger.error("Error in verifying payment", { error })
        const message = error instanceof Error ? error.message : 'Unknown error';
        return response.status(500).json({
            success: false,
            message: `Payment verification failed:${message}`,
            error: message
        });
    } finally {
        await session.endSession();
    }

}