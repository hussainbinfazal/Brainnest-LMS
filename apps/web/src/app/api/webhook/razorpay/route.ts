// app/api/webhook/razorpay/route.ts
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Order, Payment, Enrollment, userCourse, logger } from '@repo/shared';
import { reconcilePayment } from '@repo/payment';
import mongoose from 'mongoose';
import { CustomNextRequest } from '@/types/server';

export async function POST(request: CustomNextRequest) {
  await connectDB(process.env.MONGODB_URI!);

  const body = await request.text(); // raw body for signature
  const signature = request.headers.get('x-razorpay-signature');

  // ✅ Verify it's actually from Razorpay
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    logger.error('Invalid webhook signature');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const event = JSON.parse(body);

  // ✅ Only handle successful payments
  if (event.event !== 'payment.captured') {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const razorpayPaymentId = event.payload.payment.entity.id;

  await reconcilePayment(razorpayPaymentId); // 👇 shared logic below

  return NextResponse.json({ received: true }, { status: 200 });
}