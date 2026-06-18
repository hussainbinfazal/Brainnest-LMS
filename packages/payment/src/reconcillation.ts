import { Enrollment, logger, Order, OrderDocument, Payment, PaymentsDocument, userCourse } from "@repo/shared";
import mongoose from "mongoose";

// lib/reconcilePayment.ts
export async function reconcilePendingOrderPayment(razorpayPaymentId: string) {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // Find payment that's still pending
        const payment: PaymentsDocument | null = await Payment.findOne({
            paymentId: razorpayPaymentId,
            paymentStatus: 'Pending'
        }).session(session);

        if (!payment) {
            // Already reconciled or doesn't exist — safe to skip
            await session.abortTransaction();
            return;
        }

        const { paymentOnModel, paymentOf } = payment;

        if (paymentOnModel === 'Course') {
            await reconcileCoursePayment({ payment, session });
        } else if (paymentOnModel === 'Chat') {
            await reconcileChatPayment({ payment, session });
        }
        await session.commitTransaction();
        logger.info('Reconciliation successful', { razorpayPaymentId });

    } catch (err: unknown) {
        if (session.inTransaction()) await session.abortTransaction();
        logger.error('Reconciliation failed', { razorpayPaymentId, err });
    } finally {
        await session.endSession();
    }
}

export async function reconcilePendingOrder(razorpayPaymentId: string) {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // Find payment that's still pending
        const payment: PaymentsDocument | null = await Payment.findOne({
            paymentId: razorpayPaymentId,
            paymentStatus: 'Pending'
        }).session(session);

        if (!payment) {
            // Already reconciled or doesn't exist — safe to skip
            await session.abortTransaction();
            return;
        }

        const chat: Document | null = await Order.findOne({
            _id: payment.paymentOf,
            status: 'pending'
        }).session(session);

        if (!order) {
            await session.abortTransaction();
            return;
        }

        const courseIds = order.orderItems.map(item => item.course);

        // ✅ Same atomic logic as your verify-payment
        payment.paymentStatus = 'Completed';
        payment.paymentAt = new Date();

        await Promise.all([
            payment.save({ session }),

            Order.findOneAndUpdate(
                { _id: order._id, status: 'pending' },
                { status: 'completed', isPaid: true, paidAt: new Date() }
            ).session(session),

            Enrollment.bulkWrite(
                courseIds.map(courseId => ({
                    updateOne: {
                        filter: { paymentId: razorpayPaymentId, courseId, status: 'Pending' },
                        update: { $set: { status: 'Completed', enrolledAt: new Date() } }
                    }
                })),
                { session }
            ),

            userCourse.bulkWrite(
                courseIds.map(courseId => ({
                    updateOne: {
                        filter: { userId: order.user, courseId },
                        update: { $set: { isEnrolled: true, enrolledAt: new Date() } },
                        upsert: true
                    }
                })),
                { session }
            )
        ]);

        await session.commitTransaction();
        logger.info('Reconciliation successful', { razorpayPaymentId });

    } catch (err: unknown) {
        if (session.inTransaction()) await session.abortTransaction();
        logger.error('Reconciliation failed', { razorpayPaymentId, err });
    } finally {
        await session.endSession();
    }
}