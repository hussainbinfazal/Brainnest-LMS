import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { getClientIp } from "@repo/shared/utils/getClientIp";
import { User, Order, Course, connectDB, validateMongooseId, logger, Enrollment, Payment } from '@repo/shared/server';
import { NextRequest, NextResponse } from 'next/server';
import { CustomNextRequest, ISessionUser, RazorpayCreateOrderRequest } from '@/types/server';

import { PaymentService, RazorpayService } from '@repo/payment';
import mongoose from 'mongoose';
import { Session } from 'next-auth';
import { auth } from '@/auth';
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";

const razorpayService = new RazorpayService()
const paymentService = new PaymentService()
const createOrderBodySchema = z.object({
  courseId: z.string(),
  amount: z.number().positive(),
});

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    const ip = getClientIp(request.headers);
    if (ip === 'unknown') logger.warn('OTP route: could not resolve client IP');
  const authSession: Session | null = await auth()
  if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
  const user: ISessionUser | null = authSession?.user;
  const userId: string | null = user?.id || '';
  if (!user || !validateMongooseId({ userId })) {
    logger.warn(`Unauthorized access attempt from IP: ${ip}`);
    return failResponse({ message: "User not found" }, 403, undefined, undefined, true)
  };
  await connectDB(process.env.MONGDB_URI!);
  const session = await mongoose.startSession();

  try {
    const body = await parseBody(request, createOrderBodySchema);
    if (!body.ok) return body.response;
    const { courseId, amount } = body.data;
    if (!courseId || !validateMongooseId({ courseId })) return failResponse({ message: "Invalid course id" }, 400, undefined, undefined, true);
    if (!amount || amount < 1) return failResponse({ message: "Invalid amount" }, 400, undefined, undefined, true);
    const [courseDB, userDB, existingOrder] = await Promise.all([
      Course.findById(courseId),
      User.findById(userId),
      Order.findOne({
        user: userId,
        'orderItems.course': courseId,
        isPaid: true
      })
    ])



    if (!courseDB || !userDB) {
      logger.error('Course or user not found in create order route');
      return failResponse({ message: 'Course or user not found' }, 404, undefined, undefined, true);
    }


    if (existingOrder) {
      return failResponse({ message: 'Course already purchased' }, 400, undefined, undefined, true);
    }

    const shortReceipt: string = paymentService.generateReceipt();

    const razorpayOrder = await razorpayService.createOrder({ amount, receipt: shortReceipt });

    await session.startTransaction();
    const [pendingPayment, newOrder, pendingEnrollment] = await Promise.all([
      Payment.findOneAndUpdate({
        paymentBy: userId,
        paymentStatus: 'Pending'
      }, {
        amount,
        paymentBy: userId,
        paymentId: razorpayOrder.id,
        paymentOnModel: 'Course',
        paymentStatus: 'Pending'

      }, {
        upsert: true,
        new: true
      }).session(session),

      Order.findOneAndUpdate({
        user: userId,
        status: 'pending'
      }, {
        user: userId,
        orderItems: [{
          course: courseId,
          price: amount
        }],
        totalPrice: amount,
        paymentMethod: 'Razorpay',
        razorpayOrderId: razorpayOrder.id,
        status: 'pending'
      }, {
        upsert: true,
        new: true
      }).session(session),
      Enrollment.findOneAndUpdate({
        user: userId,
        course: courseId,
        status: 'Pending'
      }, {
        user: userId,
        course: courseId,
        price: amount,
        paymentId: razorpayOrder.id,
        status: 'Pending'
      }, {
        upsert: true,
        new: true
      }).session(session)
    ])
    pendingPayment.paymentOf = newOrder._id
    await pendingPayment.save({ session })



    if (!newOrder) {
      logger.error('Error in creating order');
      await session.abortTransaction();
      return failResponse({ message: 'Internal server error, Try again' }, 404, undefined, undefined, true);
    }
    await session.commitTransaction();
    return successResponse({
      success: true,
      orderId: newOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: amount
    }, 200, undefined, undefined, true);

  } catch (error: unknown) {
    if (session.inTransaction()) await session.abortTransaction();
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(message);
    return failResponse({
      success: false,
      message: `Failed to create order`,
    }, 500, undefined, undefined, true);
  }
}