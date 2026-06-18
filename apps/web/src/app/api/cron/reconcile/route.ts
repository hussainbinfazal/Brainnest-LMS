// app/api/cron/reconcile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Order, Payment, logger, OrderDocument } from '@repo/shared';
import { RazorpayService, reconcilePayment } from '@repo/payment';
import { CustomNextRequest } from '@/types/server';

const razorpayService = new RazorpayService();

export async function GET(request: CustomNextRequest) {

    // ✅ Protect the cron endpoint
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        logger.info('Unauthorized', { ip: request.ip });
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB(process.env.MONGODB_URI!);

    // ✅ Find orders stuck in pending for more than 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const stuckOrders: OrderDocument[] | null = await Order.find({
        status: 'pending',
        createdAt: { $lt: tenMinutesAgo }
    }).limit(50);

    logger.info(`Found ${stuckOrders.length} stuck orders`);

    for (const order of stuckOrders) {
        try {
            // ✅ Ask Razorpay directly — did this payment actually succeed?
            const payment = await Payment.findOne({ paymentOf: order._id });
            if (!payment) continue;

            const razorpayPayment = await razorpayService.fetchPayment(payment.paymentId);

            if (razorpayPayment.status === 'captured') {
                // Razorpay says captured but our DB says pending — reconcile it
                logger.warn('Drift detected, reconciling', { orderId: order._id });
                await reconcilePayment(payment.paymentId);
            } else if (razorpayPayment.status === 'failed') {
                // Mark as failed in our DB too
                await Order.findByIdAndUpdate(order._id, { status: 'failed' });
                await Payment.findByIdAndUpdate(payment._id, { paymentStatus: 'Failed' });
            }

        } catch (err: unknown) {
            logger.error('Cron reconcile error for order', { orderId: order._id, err });
            continue; // don't let one failure stop the rest
        }
    }
    logger.info(`Reconciled ${stuckOrders.length} stuck orders`);
    return NextResponse.json({ reconciled: stuckOrders.length }, { status: 200 });
}