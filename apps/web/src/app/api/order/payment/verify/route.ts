import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Payment, User, Course, userCourse, Order, logger, connectDB, Enrollment, validateMongooseId, PaymentsDocument, OrderDocument, } from '@repo/shared/server';
import { ICourse, IOrder, IPayments, IUser } from '@repo/shared/server';
import mongoose from 'mongoose';
import { markPaymentCompleted, PaymentService } from '@repo/payment';
import axios from 'axios';
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";
const paymentService: PaymentService = new PaymentService();
const verifyPaymentBodySchema = z.object({
  orderId: z.string(),
  paymentId: z.string(),
  signature: z.string(),
  userId: z.string(),
  amount: z.number(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  await connectDB(process.env.MONGODB_URI!);
  const session: mongoose.ClientSession = await mongoose.startSession();
  let razorpayPaymentID: string | undefined = "";
  try {

    const body = await parseBody(request, verifyPaymentBodySchema);
    if (!body.ok) return body.response;
    const { orderId, paymentId, signature, userId, amount } = body.data;
    if (!orderId || !paymentId || !signature || !userId || !amount) {
      logger.warn('Invalid data');
      return failResponse({ message: "Invalid data" }, 400, undefined, undefined, true)
    };
    if (!validateMongooseId({ orderId: orderId })) {
      logger.error("Invalid Order Id", { orderId });
      return failResponse({ message: "Invalid Data" }, 400, undefined, undefined, true)
    };

    if (!validateMongooseId({ userId: userId })) {
      logger.error("Invalid User Id in payment", { userId });
      return failResponse({ message: "Invalid Data" }, 400, undefined, undefined, true)
    };
    logger.info('Payment verification request data', { orderId, paymentId, userId, amount },)
    await session.startTransaction();;
    const [pendingOrder, pendingPayment] = await Promise.all([
      Order.findOne({ _id: orderId, status: 'Pending' }).session(session).exec(),
      Payment.findOne({ paymentId, paymentStatus: 'Pending' }).session(session).exec()
    ]);
    razorpayPaymentID = paymentId
    // Verify Razorpay signature

    if (!pendingPayment) {
      logger.error('Payment not found');
      return failResponse({
        success: false,
        message: 'Payment not found'
      }, 404, undefined, undefined, true);
    }
    if (!pendingOrder) {
      await session.abortTransaction();
      logger.error('Order not found', { orderId });
      return failResponse({ message: 'Order not found' }, 404, undefined, undefined, true);
    }

    const isAuthentic: boolean = paymentService.verifyPayment(pendingPayment.paymentId, paymentId, signature);

    if (!isAuthentic) {

      await Promise.all([
        Order.findOneAndUpdate(
          { _id: orderId, status: 'Pending' },
          {
            status: 'Failed',
            paymentResult: {
              id: paymentId,
              status: 'Failed',
              update_time: new Date().toISOString(),
              failure_reason: 'Invalid payment signature'
            }
          }

        ).session(session).exec(),

        Payment.findOneAndUpdate(
          { paymentId, paymentStatus: 'Pending' },
          { paymentStatus: 'Failed' }
        ).session(session).exec()
      ]);
      await session.commitTransaction();
      logger.error('Invalid payment signature', { orderId, paymentId });
      return failResponse({
        success: false,
        message: 'Invalid payment signature'
      }, 400, undefined, undefined, true);


    }
    if (!pendingPayment) {
      await session.abortTransaction();
      logger.error('Payment not found', { paymentId });
      return failResponse({ message: 'Payment not found' }, 404, undefined, undefined, true);
    }

    const courseIds: mongoose.Types.ObjectId[] = pendingOrder.orderItems.map((item: { course: mongoose.Types.ObjectId }) => item.course);

    if (!courseIds.length) {
      await session.abortTransaction();
      logger.error('Order has no courses', { orderId });
      return failResponse({ message: 'Invalid order' }, 400, undefined, undefined, true);
    }
    const completedOrder: OrderDocument | null = await Order.findOneAndUpdate(
      { _id: orderId, status: 'Pending' },
      {
        status: 'Completed',
        isPaid: true,
        paidAt: new Date(),
        paymentResult: {
          id: paymentId,
          status: 'Completed',
          update_time: new Date().toISOString()
        }
      },
      { new: true }
    ).session(session).exec();

    if (!completedOrder) {
      throw new Error('Order completion failed — may have already been processed');
    }


    pendingPayment.paymentStatus = 'Completed';
    pendingPayment.amount = amount;
    pendingPayment.paymentAt = new Date();
    pendingPayment.paymentBy = userId;
    pendingPayment.paymentOnModel = 'Order';
    pendingPayment.paymentOf = completedOrder._id;

    const [, enrollmentResult, userCourseResult] = await Promise.all([

      pendingPayment.save({ session }),

      Enrollment.bulkWrite(
        courseIds.map(courseId => ({
          updateOne: {
            filter: { paymentId, courseId, status: 'Pending' },
            update: {
              $set: {
                status: 'Completed',
                enrolledAt: new Date()
              }
            }
          }
        })),
        { session }
      ),

      userCourse.bulkWrite(
        courseIds.map(courseId => ({
          updateOne: {
            filter: { userId, courseId },
            update: {
              $set: { isEnrolled: true, enrolledAt: new Date() }
            },
            upsert: true
          }
        })),
        { session }
      )
    ]);

    if (enrollmentResult.modifiedCount !== courseIds.length) {
      logger.warn('Some enrollments may have failed', {
        expected: courseIds.length,
        modified: enrollmentResult.modifiedCount
      });
    }

    await session.commitTransaction();

    logger.info('Payment verified successfully', {
      orderId,
      paymentId,
      userId,
      coursesEnrolled: courseIds.length
    });

    return successResponse({
      success: true,
      message: 'Payment verified successfully, Order Generated Successfully',
    }, 200, undefined, undefined, true);

  } catch (error: unknown) {
    if (session.inTransaction()) await session.abortTransaction();
    ///complete this one 
    await axios.post('/api/queue/reconcile', { razorpayPaymentId: razorpayPaymentID, });
    // await reconcileQueue.add('reconcile-single', {
    //   razorpayPaymentId: razorpayPaymentID // ✅ matches job.data.razorpayPaymentId
    // });
    // Try to mark order as failed if possible
    const message: string = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error verifying payment', { message });
    return failResponse({
      success: false,
      message: `Payment verification failed`,
    }, 500, undefined, undefined, true);
  } finally {
    await session.endSession();
  }
}