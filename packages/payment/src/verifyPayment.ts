import {
  PAYMENT_STATUS,
  PaymentHandlers,
  SettleInput,
  SettleOutcome,
  SettleSource,
  brainnestHandlers,
  verifyCheckoutSignature,
} from '@repo/payment';
import { Payment, PaymentDocument, logger } from '@repo/shared/server';
import mongoose, { ClientSession, Types } from 'mongoose';

// Error that carries an HTTP status for the route to use
export class PaymentError extends Error {
  // Status is a parameter property, stored automatically
  constructor(
    message: string,
    public status: number = 400,
  ) {
    // Pass message to Error
    super(message);
  }
}

export async function settlePayment(
  input: SettleInput,
  handlers: PaymentHandlers,
): Promise<SettleOutcome> {
  const session = await mongoose.startSession();
  let outcome: SettleOutcome = 'already_settled';
  const {
    razorpayOrderId,
    razorpayPaymentId,
    paymentMethod,
    paymentBy,
    amountInPaise,
  } = input;

  if (!Number.isSafeInteger(amountInPaise) || amountInPaise <= 0) {
    throw new PaymentError('Invalid payment amount', 400);
  }

  try {
    await session.withTransaction(async () => {
      outcome = 'already_settled';
      const existingPayment = await Payment.findOne({
        razorpayOrderId: razorpayOrderId,
        paymentBy: paymentBy,
      }).session(session);

      if (!existingPayment) {
        outcome = 'not_found';
        return;
      }

      if (Math.round(existingPayment.amount * 100) !== amountInPaise) {
        throw new PaymentError('Payment amount does not match the order', 400);
      }

      if (existingPayment.paymentStatus === PAYMENT_STATUS.COMPLETED) {
        outcome = 'already_settled';
        return;
      }

      const payment = await Payment.findOneAndUpdate(
        {
          _id: existingPayment._id,
          razorpayOrderId: razorpayOrderId,
          paymentBy: paymentBy,
          // Failed is allowed too, so a late capture after the sweep gave up still gets fulfilled
          paymentStatus: {
            $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.FAILED],
          },
        },
        {
          $set: {
            paymentStatus: PAYMENT_STATUS.COMPLETED,
            razorpayOrderId: razorpayOrderId,
            paymentAt: new Date(),
            paymentMethod: paymentMethod,
            paymentId: razorpayPaymentId,
          },
        },
        { returnDocument: 'after', session },
      );

      if (!payment) {
        outcome = 'already_settled';
        return;
      }
      const handler = handlers[payment.paymentOnModel];
      if (!handler) {
        throw new Error(`No handler for ${payment.paymentOnModel}`);
      }
      await handler.fulfill({ payment, session });
      outcome = 'settled';
    });
    logger.info('Settled payment with id: ', { ...input, outcome });
    return outcome;
  } finally {
    session.endSession();
  }
}
export async function verifyAndSettle({
  userId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  paymentMethod,
  amountInPaise,
}: {
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentMethod: string;
  amountInPaise: number;
}) {
  if (
    !verifyCheckoutSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    )
  ) {
    // 400 for a bad signature
    throw new PaymentError('Invalid payment signature', 400);
  }

  // The payment must belong to the logged-in user
  const owned = await Payment.exists({
    razorpayOrderId: razorpayOrderId,
    paymentBy: userId,
  });
  // 404 so we do not reveal that someone else's order exists
  if (!owned) throw new PaymentError('Payment not found', 404);
  let input: SettleInput = {
    razorpayOrderId: razorpayOrderId,
    razorpayPaymentId: razorpayPaymentId,
    paymentBy: userId,
    paymentMethod: paymentMethod,
    amountInPaise: amountInPaise,
    source: 'verify',
  };
  // Settle through the shared idempotent path
  return settlePayment(input, brainnestHandlers);
}
