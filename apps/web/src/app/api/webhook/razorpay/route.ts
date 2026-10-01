import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
// app/api/webhook/razorpay/route.ts
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Order, Payment, Enrollment, userCourse, logger } from '@repo/shared/server';
import { reconcilePayment } from '@repo/payment';
import mongoose from 'mongoose';
import { CustomNextRequest } from '@/types/server';

export async function POST(request: CustomNextRequest) {

  const body = await request.text(); // raw body for signature
  const signature = request.headers.get('x-razorpay-signature');

  // ✅ Verify it's actually from Razorpay
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    logger.error('Invalid webhook signature');
    return failResponse({ message: 'Unauthorized' }, 401, undefined, undefined, true);
  }

  const event = JSON.parse(body);

  // ✅ Only handle successful payments
  if (event.event !== 'payment.captured') {
    return successResponse({ received: true }, 200, undefined, undefined, true);
  }

  const razorpayPaymentId = event.payload.payment.entity.id;

  await reconcilePayment(razorpayPaymentId); // 👇 shared logic below

  return successResponse({ received: true }, 200, undefined, undefined, true);
}