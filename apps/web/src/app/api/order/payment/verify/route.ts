import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextRequest, NextResponse } from 'next/server';
import { Payment, logger, connectDB, checkIp, VERIFY_PAYMENT_IP_KEY, checkUser, VERIFY_PAYMENT_USER_KEY, } from '@repo/shared/server';
import { getRazorpay, PaymentError, verifyAndSettle, verifyCheckoutSignature } from '@repo/payment';
import axios from 'axios';
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";
import { Session } from "next-auth";
import { auth } from "@/auth";
const verifyPaymentBodySchema = z.object({
  orderId: z.string().regex(/^order_[A-Za-z0-9]+$/),
  paymentId: z.string().regex(/^pay_[A-Za-z0-9]+$/),
  signature: z.string().regex(/^[a-f0-9]{64}$/),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { allowed, retryAfterSec, ip } = await checkIp(request, VERIFY_PAYMENT_IP_KEY.namespace, VERIFY_PAYMENT_IP_KEY.max, VERIFY_PAYMENT_IP_KEY.windowSec);

  if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);

  const authSession: Session | null = await auth()
  if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);

  const userId: string = authSession.user.id
  const {
    allowed: isUserAllowed,
    retryAfterSec: retryAfter,
  } = await checkUser(
    authSession.user.id,
    VERIFY_PAYMENT_USER_KEY.namespace,
    VERIFY_PAYMENT_USER_KEY.max,
    VERIFY_PAYMENT_USER_KEY.windowSec
  );
  if (!isUserAllowed) {
    logger.warn("Too many requests in order status route", { user: authSession.user.id });
    return failResponse(
      { message: "Too many requests" },
      429,
      undefined,
      { "Retry-After": String(retryAfter) },
      true
    );
  }
  const body = await parseBody(request, verifyPaymentBodySchema);
  if (!body.ok) return body.response;
  const { orderId, paymentId, signature } = body.data;

  //Becomes true only after the HMAC check passes; it decides whether a backgroud retry is safe

  let signatureVerified: boolean = false
  try {
    if (!verifyCheckoutSignature(orderId, paymentId, signature)) {
      logger.warn("Invalid payment Signature", { orderId, paymentId, userId })
      return failResponse({ error: "Invalid Payment Signature", messge: 'Invalid Payment Signature' }, 400, undefined, undefined, true)
    }
    signatureVerified = true
    const razorpayPayment = await getRazorpay().fetchPayment(paymentId);
    if (razorpayPayment.order_id !== orderId) {
      return failResponse({ message: "Payment does not match the order" }, 400, undefined, undefined, true);
    }
    await connectDB(process.env.MONGODB_URI!);
    const outcome = await verifyAndSettle(
      { userId: userId, razorpayOrderId: orderId, razorpayPaymentId: paymentId, razorpaySignature: signature, paymentMethod: razorpayPayment.method },
    )
    if (outcome === "not_found") {
      return failResponse({ message: 'Payment not found' }, 404, undefined, undefined, true)
    }
    return successResponse({ outcome }, 200, undefined, undefined, true)

  } catch (error: unknown) {
    if (error instanceof PaymentError) {
      logger.warn("Payment verify rejected", { error });
      return failResponse({ message: error.message }, error.status, undefined, undefined, true)
    }
    const workerUrl = process.env.WORKER_URL
    const internalAuthSecret = process.env.INTERNAL_AUTH_SECRET
    if (!workerUrl || !internalAuthSecret) {
      logger.error("Error verifying payment", { error });
      return failResponse({
        success: false,
        message: `Payment verification failed`,
      }, 500, undefined, undefined, true);
    }
    logger.error("Error verifying payment", { error });
    if (signatureVerified) {
      try {
        await axios.post(`${workerUrl}/api/payment/settle-payment`, { razorpayPaymentId: paymentId });
      } catch (workerError: unknown) {
        logger.error("Could not settle queue settle retry", { orderId, workerError });
      }

    }
    ///complete this one
    // await reconcileQueue.add('reconcile-single', {
    //   razorpayPaymentId: razorpayPaymentID // ✅ matches job.data.razorpayPaymentId
    // });
    // Try to mark order as failed if possible
    const message: string = signatureVerified
      ? "Payment received. We are confirming it."
      : "Payment verification failed";
    logger.error('Error verifying payment', { message });
    return failResponse({
      success: false,
      message,
    }, 500, undefined, undefined, true);
  }
}