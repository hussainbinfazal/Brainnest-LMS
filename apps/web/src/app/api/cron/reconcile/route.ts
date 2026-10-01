import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
// app/api/cron/reconcile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkIp, connectDB, CRON_RECONCILE_IP_KEY, Order, Payment, logger, OrderDocument } from '@repo/shared/server';
import { RazorpayService, reconcilePayment } from '@repo/payment';
import { CustomNextRequest } from '@/types/server';

const razorpayService = new RazorpayService();

export async function GET(request: CustomNextRequest) {
    const { allowed, retryAfterSec, ip } = await checkIp(request, CRON_RECONCILE_IP_KEY.namespace, CRON_RECONCILE_IP_KEY.max, CRON_RECONCILE_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);

    // ✅ Protect the cron endpoint
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        logger.info('Unauthorized', { ip: ip });
        return failResponse({ message: 'Unauthorized' }, 401, undefined, undefined, true);
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
    return successResponse({ reconciled: stuckOrders.length }, 200, undefined, undefined, true);
}