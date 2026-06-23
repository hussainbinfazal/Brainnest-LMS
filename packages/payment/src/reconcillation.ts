// @repo/payment/src/reconcilePayment.ts
import { logger, Order, Payment, Enrollment, userCourse, OrderDocument, PaymentsDocument, Chat, ChatDocument } from "@repo/shared";
import mongoose, { ClientSession } from "mongoose";
import { RazorpayService } from "./razorpay.service";

const razorpayService: RazorpayService = new RazorpayService(); // ✅ instantiated once at top

// ─────────────────────────────────────────────
// Function 1: FULL SWEEP
// Called by cron job every 15 mins
// Finds all stuck orders and reconciles them
// ─────────────────────────────────────────────
export async function reconcileStuckOrders() {
    const tenMinutesAgo: Date = new Date(Date.now() - 10 * 60 * 1000);
    const stuckOrders: OrderDocument[] | null = await Order.find({
        status: 'Pending',        
        createdAt: { $lt: tenMinutesAgo }
    }).limit(50);

    logger.info(`Found ${stuckOrders.length} stuck orders`);

    for (const order of stuckOrders) {
        try {
            const payment: PaymentsDocument | null = await Payment.findOne({ paymentOf: order._id });
            if (!payment) continue;

          
            const razorpayPayment = await razorpayService.fetchPayment(payment.paymentId);

            if (razorpayPayment.status === 'captured') {
                logger.warn('Drift detected, reconciling', { orderId: order._id });
                await reconcilePayment(payment.paymentId);

            } else if (razorpayPayment.status === 'failed') {
                // ✅ No transaction needed for simple status updates
                await Promise.all([
                    Order.findByIdAndUpdate(order._id, { status: 'failed' }),
                    Payment.findByIdAndUpdate(payment._id, { paymentStatus: 'Failed' })
                ]);
            }

        } catch (error: unknown) {
            logger.error('Reconcile failed for order', { orderId: order._id, error });
            continue;
        }
    }
}

// ─────────────────────────────────────────────
// Function 2: SINGLE PAYMENT RECONCILE
// Called by webhook or immediate job
// Fixes one specific payment
// ─────────────────────────────────────────────
export async function reconcilePayment(razorpayPaymentId: string) {
    const session = await mongoose.startSession();

    try {
        session.startTransaction(); // ✅ actually start it

        const payment: PaymentsDocument | null = await Payment.findOne({
            paymentId: razorpayPaymentId,
            paymentStatus: 'Pending'
        }).session(session);

        if (!payment) {
            await session.abortTransaction();
            return; // ✅ already reconciled, safe to skip
        }

        // ✅ branch based on what type of payment this is
        if (payment.paymentOnModel === 'Course') {
            await reconcileCoursePayment({ payment, session });
        } else if (payment.paymentOnModel === 'Chat') {
            await reconcileChatPayment({ payment, session });
        }

        await session.commitTransaction();
        logger.info('Reconciliation successful', { razorpayPaymentId });

    } catch (err: unknown) {
        if (session.inTransaction()) await session.abortTransaction();
        logger.error('Reconciliation failed', { razorpayPaymentId, err });
        throw err; // ✅ rethrow so BullMQ knows to retry
    } finally {
        await session.endSession(); // ✅ always end session
    }
}

// ─────────────────────────────────────────────
// Function 3a: COURSE SPECIFIC LOGIC
// Fixes Order + Enrollment + userCourse
// ─────────────────────────────────────────────
async function reconcileCoursePayment({ payment, session }: { payment: PaymentsDocument; session: ClientSession }) {
    try {
        const order: OrderDocument | null = await Order.findOne({
            _id: payment.paymentOf,
            status: 'Pending'
        }).session(session);

        if (!order) return;

        const courseIds: mongoose.Types.ObjectId[] = order.orderItems.map(item => item.course);

        await Promise.all([
            payment.save({ session }),

            Order.findOneAndUpdate(
                { _id: order._id, status: 'Pending' },
                { status: 'Completed', isPaid: true, paidAt: new Date() }
            ).session(session),

            Enrollment.bulkWrite(
                courseIds.map(courseId => ({
                    updateOne: {
                        filter: { paymentId: payment.paymentId, courseId, status: 'Pending' },
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
        ])
    } catch (error: unknown) { 
        
    };
}

// ─────────────────────────────────────────────
// Function 3b: CHAT SPECIFIC LOGIC  
// Fixes Chat payment status
// ─────────────────────────────────────────────
async function reconcileChatPayment({ payment, session }: { payment: PaymentsDocument; session: ClientSession }) {
    const chat: ChatDocument | null = await Chat.findOne({
        _id: payment.paymentOf,
        status: 'Pending'       // 👈 whatever your chat pending state is
    }).session(session);

    if (!chat) return;

    await Promise.all([
        payment.save({ session }),

        Chat.findOneAndUpdate(
            { _id: chat._id },
            { isActive: true, }  // 👈 whatever activated state is
        ).session(session),

        // any other chat-specific updates
    ]);
}