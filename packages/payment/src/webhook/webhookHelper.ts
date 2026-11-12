import { logger } from '@repo/shared/server';
import axios from 'axios';

import { verifyWebhookSignature } from '../Signature';
import { PAYMENT_SOURCE } from '../payment.constant';

export async function handleRazorypayWebhook(
  req: { rawBody: string; signature: string | null },
  userId: string,
): Promise<{ status: number }> {
  if (!req.signature || !verifyWebhookSignature(req.rawBody, req.signature)) {
    return { status: 400 };
  }

  /// Safe to parse now that the signature matched
  const event = JSON.parse(req.rawBody);

  ///Both events mean "money captured"; failures are ignored because the user can retry on the same order
  if (event.event === 'payment.captured' || event.event === 'payment.paid') {
    // Razorpay payment nested structure
    const entity = event.payload?.payment?.entity;
    //Signed but malformed: acknowledge so Razorpay stops retrying
    if (entity?.order_id || !entity?.id) return { status: 200 };
    const jobData = {
      razorpayOrderId: entity.order_id,
      razorpayPaymentId: entity.id,
      paymentMethod: entity.method,
      paymentBy: userId,
      amount: entity.amount,
      error: entity.error,
      source: 'webhook',
    };
    // const jobOptions = {
    //     jobId: `settle-${entity.order_id}`,
    //     // Retry transient DB errors
    //     attempts: 5,
    //     // Exponential backoff starting at 5s
    //     backoff: { type: "exponential", delay: 5000 },
    //     // Keep recent completed ids so late duplicates are still deduped
    //     removeOnComplete: 1000,
    // }

    const workerUrl = process.env.WORKER_URL;
    const internalSecret = process.env.INTERNAL_AUTH_SECRET;
    const settleRoute = process.env.SETTLE_PAYMENT_WORKER_ROUTE;
    if (!workerUrl || !settleRoute || !internalSecret) {
      throw new Error(
        'WORKER_URL, and INTERNAL_AUTH_SECRET must be configured',
      );
    }

    try {
      await axios.post(
        // Worker address from a server-only env var
        `${workerUrl}/${settleRoute}`,
        jobData,
        // Internal secret header plus a timeout so the route cannot hang
        { headers: { 'x-internal-secret': internalSecret }, timeout: 10_000 },
      );
    } catch (workerError) {
      logger.error('Failed to send settle job to worker', { workerError });
      throw new Error();
    }
  } else {
    logger.error('Ignored Razorpay event', { event: event.event });
  }
  return { status: 200 };
}
