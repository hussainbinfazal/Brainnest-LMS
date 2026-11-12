import mongoose, { ClientSession, Types } from 'mongoose';
import { logger, Payment, PaymentDocument } from '@repo/shared/server';
import { brainnestHandlers, PAYMENT_STATUS, PaymentHandlers, SettleInput, SettleOutcome, SettleSource, verifyCheckoutSignature } from '@repo/payment';


// Error that carries an HTTP status for the route to use
export class PaymentError extends Error {
  // Status is a parameter property, stored automatically
  constructor(message: string, public status: number = 400) {
    // Pass message to Error
    super(message);
  }
}


export async function settlePayment(input: SettleInput, handlers: PaymentHandlers): Promise<SettleOutcome> {
  const session = await mongoose.startSession();
  let outcome: SettleOutcome = "already_settled";
  const { razorpayOrderId, razorpayPaymentId, paymentMethod} = input;

  try {
    await session.withTransaction(async () => {
      outcome = 'already_settled';
      const payment = await Payment.findOneAndUpdate({
        razorpayOrderId: razorpayOrderId,
        //Failed is allowed too, so a late capture after the sweep gave up still gets fulfilled
        paymentStatus: { $in: ['Pending', 'Failed'] }
      }, {
        $set: {
          // error_code: error.code,
          // error_description: error.description,
          // error_source: error.source,
          // error_step: error.step,
          // error_reason: error.reason,
          paymentStatus: PAYMENT_STATUS.COMPLETED,
          razorpayOrderId: razorpayOrderId,
          paymentMethod: paymentMethod,
          paymentId: razorpayPaymentId,
        }
      }, { returnDocument: 'after', session });
      // Nothing to claim: either unknown order or someone already settled it

      if (!payment) {
        // Distinguish the two cases
        const exists = await Payment.exists({
          razorpayOrderId: razorpayOrderId,
        })
        outcome = exists ? 'not_found' : 'already_settled';
        return

      }
      const handler = handlers[payment.paymentOnModel];
      if (!handler) {
        throw new Error(`No handler for ${payment.paymentOnModel}`);

      }
      await handler.fulfill({ payment, session });
      outcome = 'settled';
    })
    logger.info("Settled payment with id: ", { ...input, outcome });
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

}: {
  userId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  paymentMethod: string,
}) {

  if (!verifyCheckoutSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    // 400 for a bad signature
    throw new PaymentError("Invalid payment signature", 400);
  }

  // The payment must belong to the logged-in user
  const owned = await Payment.exists({
    razorpayOrderId: razorpayOrderId,
    paymentBy: userId,
  });
  // 404 so we do not reveal that someone else's order exists
  if (!owned) throw new PaymentError("Payment not found", 404);
  let input: SettleInput = {
    razorpayOrderId: razorpayOrderId,
    razorpayPaymentId: razorpayPaymentId,
    paymentBy: userId,
    paymentMethod: paymentMethod,
    source: "verify",
  }
  // Settle through the shared idempotent path
  return settlePayment(
    input,
    brainnestHandlers
  );
}