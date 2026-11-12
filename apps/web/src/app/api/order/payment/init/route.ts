import {
  failResponse,
  successResponse,
} from "@/lib/helpers/failResponseHelper";
import {
  Order,
  Course,
  checkIp,
  connectDB,
  validateMongooseId,
  logger,
  Enrollment,
  Payment,
  INIT_PAYMENT_USER_KEY,
  checkUser,
  INIT_PAYMENT_IP_KEY,
} from "@repo/shared/server";
import { NextResponse } from "next/server";
import { CustomNextRequest, ISessionUser } from "@/types/server";

import { getRazorpay, ORDER_STATUS, PAYMENT_STATUS } from "@repo/payment";
import mongoose from "mongoose";
import { Session } from "next-auth";
import { auth } from "@/auth";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";
const createOrderBodySchema = z.object({
  courseId: z.string().min(1),
});

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
  const { allowed, retryAfterSec, ip } = await checkIp(
    request,
    INIT_PAYMENT_IP_KEY.namespace,
    INIT_PAYMENT_IP_KEY.max,
    INIT_PAYMENT_IP_KEY.windowSec
  );

  if (!allowed)
    return failResponse(
      { message: "Too many requests" },
      429,
      undefined,
      { "Retry-After": String(retryAfterSec) },
      true
    );

  const authSession: Session | null = await auth();
  if (!authSession)
    return failResponse(
      { message: "Unauthorized", ip: ip },
      401,
      undefined,
      undefined,
      true
    );

  const { allowed: isUserAllowed, retryAfterSec: retryAfter } = await checkUser(
    authSession.user.id,
    INIT_PAYMENT_USER_KEY.namespace,
    INIT_PAYMENT_USER_KEY.max,
    INIT_PAYMENT_USER_KEY.windowSec
  );
  if (!isUserAllowed) {
    logger.warn("Too many requests in init payment route", {
      user: authSession.user.id,
    });
    return failResponse(
      { message: "Too many requests" },
      429,
      undefined,
      { "Retry-After": String(retryAfter) },
      true
    );
  }
  const user: ISessionUser | null = authSession?.user;
  const userId: string | null = user.id;
  if (!user || !validateMongooseId({ userId })) {
    logger.warn(`Unauthorized access attempt from IP: ${ip}`);
    return failResponse(
      { message: "User not found" },
      403,
      undefined,
      undefined,
      true
    );
  }
  try {
    const body = await parseBody(request, createOrderBodySchema);
    if (!body.ok) return body.response;
    const { courseId } = body.data;
    if (!validateMongooseId({ courseId }))
      return failResponse(
        { message: "Invalid course id" },
        400,
        undefined,
        undefined,
        true
      );

    await connectDB(process.env.MONGDB_URI!);

    const [course, alreadyPurchased] = await Promise.all([
      Course.findById(courseId).select("title price").lean().exec(),
      Order.exists({
        user: userId,
        "orderItems.course": courseId,
        isPaid: true,
      })
        .lean()
        .exec(),
    ]);

    if (!course) {
      return failResponse(
        { message: "Course or user not found" },
        404,
        undefined,
        undefined,
        true
      );
    }
    if (alreadyPurchased) {
      return failResponse(
        {
          message: "Course already purchased",
        },
        400,
        undefined,
        undefined,
        true
      );
    }

    ////Check with classes
    const price: number = Number(course.price);
    if (!Number.isFinite(price) || price <= 0) {
      return failResponse(
        { message: "Invalid course price" },
        400,
        undefined,
        undefined,
        true
      );
    }

    ///Razorpay part
    // Razorpay wants integer paise; round to avoid float errors like 499.00000001
    const amountInPaise: number = Math.round(price * 100);
    const chargedPrice: number = amountInPaise / 100;
    const orderId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId();
    const paymentDbId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId();
    const shortReceipt: string = `ord_${orderId.toString()}`;
    const razorpayOrder = await getRazorpay().createOrder({
      amountInPaise,
      receipt: shortReceipt,
      notes: {
        orderId: orderId.toString(),
        userId: userId.toString(),
        courseId: courseId.toString(),
        createdAt: new Date().toISOString(),
      },
    });

    ///Service logic
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        ///Sequential await intentionally
        await Payment.create(
          [
            {
              _id: paymentDbId,
              amount: chargedPrice,
              paymentBy: userId,
              paymentOf: courseId,
              paymentMethod: "Razorpay",
              paymentOnModel: "Course",
              razorpayOrderId: razorpayOrder.id,
              paymentStatus: PAYMENT_STATUS.PENDING,
            },
          ],
          { session }
        );
        await Order.create(
          [
            {
              _id: orderId,
              user: userId,
              orderItems: [
                {
                  course: courseId,
                  price: chargedPrice,
                },
              ],
              totalPrice: chargedPrice,
              razorpayOrderId: razorpayOrder.id,
              status: ORDER_STATUS.PENDING,
            },
          ],
          { session }
        );
      });
    } finally {
      await session.endSession();
    }
    return successResponse(
      {
        orderId: orderId.toString(),
        razorpayOrderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: "INR",
      },
      200,
      undefined,
      undefined,
      true
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error in initiate payment service";
    logger.error("Error in initiate payment", { error, message });
    return failResponse(
      {
        success: false,
        message: `Failed to initiate payment`,
      },
      500,
      undefined,
      undefined,
      true
    );
  }
}
