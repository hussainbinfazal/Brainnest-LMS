import { Payment, logger } from '@repo/shared/server';
import mongoose from 'mongoose';

import { PAYMENT_STATUS } from './payment.constant';
import { PaymentHandlers } from './payment.types';
import { type RazorpayService, getRazorpay } from './razorpay.service';
import { settlePayment } from './verifyPayment';

// Do not touch payments younger than this; the webhook is probably still on its way
const GRACE_MS = 10 * 60 * 1000;
// Stop waiting after a day
const GIVE_UP_MS = 24 * 60 * 60 * 1000;

///Payments checked per run, keeps razorpay API usage bounded
const BATCH_SIZE = 50;

export interface SweepResult {
  checked: number;
  settled: number;
  expired: number;
  failed: number;
}

export async function sweepPendingPayments(
  handlers: PaymentHandlers,
  razorpay: RazorpayService = getRazorpay(),
): Promise<SweepResult> {
  //Find pending payments whose webhook status has not been received
  const pending = await Payment.find({
    paymentStatus: PAYMENT_STATUS.PENDING,
    createdAt: { $lte: new Date(Date.now() - GRACE_MS) },
  })
    .sort({ reconcileCheckAt: -1 })
    .limit(BATCH_SIZE);

  ///Count the results of the sweep
  const result: SweepResult = {
    checked: pending.length,
    settled: 0,
    expired: 0,
    failed: 0,
  };
  ///Process payment one by one and update the database
  for (let payment of pending) {
    try {
      await Payment.updateOne(
        {
          _id: payment._id,
        },
        {
          $set: {
            ///Mark the payment as reconciled by the sweep
            reconcileCheckedAt: new Date(),
          },
        },
      );

      ///Fetch Payment from the razorpay API
      const { items } = await razorpay.fetchOrderPayments(
        payment.razorpayOrderId!,
      );
      ///Find the captured payment
      const captured = items.find((p) => p.status === 'captured');
      // Money received but we missed the webhook: settle now
      if (captured) {
        ///Settle the captured payment and update the database with the result
        const outcome = await settlePayment(
          {
            razorpayOrderId: payment.razorpayOrderId!,
            razorpayPaymentId: captured.id,
            paymentMethod: captured.method,
            paymentBy: payment.paymentBy,
            amountInPaise: Number(captured.amount),
            source: 'sweep',
          },
          handlers,
        );
        ////Count the result
        if (outcome === 'settled') result.settled++;
        ///Skip expired payments
        continue;
      }
      ///Check if the payment is expired
      const age = Date.now() - (payment.get('createdAt') as Date).getTime();
      if (age > GIVE_UP_MS && (await expirePayment(payment._id, handlers))) {
        result.expired++;
      }
    } catch (sweepError: unknown) {
      result.failed++;
      logger.error('Sweep failed for payment', {
        razorpayOrderId: payment.razorpayOrderId,
        sweepError,
      });
    }
  }
  logger.info('Sweep Finished for payment', { ...result });

  if (result.failed > 0)
    throw new Error(`Sweep finished with ${result.failed} failed payments`);
  return result;
}

// Marks a payment Failed and lets the domain clean up, in one transaction. Returns true if it expired one

async function expirePayment(
  paymentId: mongoose.Types.ObjectId,
  handlers: PaymentHandlers,
): Promise<boolean> {
  const session = await mongoose.startSession();
  let expired = false;
  try {
    await session.withTransaction(async () => {
      // Reset on every attempt
      expired = false;
      // Claim only if it is still Pending(a late capture may have just settled it)
      const claimed = await Payment.findOneAndUpdate(
        {
          _id: paymentId,
          paymentStatus: PAYMENT_STATUS.PENDING,
        },
        {
          $set: {
            paymentStatus: PAYMENT_STATUS.FAILED,
          },
        },
        { returnDocument: 'after', session },
      );
      // Someone else got there first
      if (!claimed) return;
      await handlers[claimed.paymentOnModel]?.expire?.({
        payment: claimed,
        session,
      });
      ///Payment has been expired
      expired = true;
    });
    return expired;
  } finally {
    await session.endSession();
  }
}
