import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Payment, User, Course, userCourse, Order, logger, connectDB } from '@repo/shared';
import { ICourse, IOrder, IPayments, IUser } from '@/types/model';
import mongoose from 'mongoose';
import { PaymentService } from '@repo/payment';
const paymentService = new PaymentService();
export async function POST(request: NextRequest) {
  await connectDB(process.env.MONGODB_URI!);
  const session = await mongoose.startSession();
  try {

    const { orderId, paymentId, signature, courseId, userId, amount } = await request.json();
    if (!orderId || !paymentId || !signature || !courseId || !userId || !amount) {
      logger.warn('Invalid data');
      return NextResponse.json({ message: "Invalid data" }, { status: 400 })
    };
    logger.info('Payment verification request data', { orderId, paymentId, courseId, userId, amount },);

    // Verify Razorpay signature
    const isAuthentic = paymentService.verifyPayment(orderId, paymentId, signature);
    const order: IOrder | null = await Order.findOne({ razorpayOrderId: orderId });
    if (!order) {
      return NextResponse.json({
        success: false,
        message: 'Order not found'
      }, { status: 404 });
    }

    if (!isAuthentic) {
      logger.error('Invalid payment signature');
      order.status = 'failed';

      order.paymentResult = {
        id: paymentId,
        status: 'failed',
        update_time: new Date().toISOString(),
        failure_reason: 'Invalid payment signature'
      };
      return NextResponse.json({
        success: false,
        message: 'Invalid payment signature'
      }, { status: 400 });
    }

    // Update order in database


    if (!isAuthentic) {
      // Mark order as failed for invalid signature

      await order.save();

      return NextResponse.json({
        success: false,
        message: 'Invalid payment signature'
      }, { status: 400 });
    }

    const payment: IPayments | null = new Payment({
      amount,
      paymentAt: new Date(),
      paymentBy: userId,
      paymentId: paymentId,
      paymentOf: order._id,
      paymentOnModel: 'Course',
    });

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentResult = {
      id: orderId,
      status: 'completed',
      update_time: new Date().toISOString()
    };
    order.status = 'completed';

    await payment.save();
    await order.save();

    // Add course to user's enrolled courses using UserCourse model
    logger.info('Looking for user for payment verification', { userId, userIdType: typeof userId });

    const user: IUser | null = await User.findById(userId);
    logger.debug({ foundUser: !!user }, 'Found user for payment verification');

    if (!user) {
      logger.warn({ userId }, 'User not found in database for payment enrollment');
      return NextResponse.json({
        success: false,
        message: `User not found for ID: ${userId}`
      }, { status: 404 });
    }

    // Create or update UserCourse record
    await UserCourse.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        courseId: new mongoose.Types.ObjectId(courseId)
      },
      {
        isEnrolled: true,
        enrolledAt: new Date()
      },
      { upsert: true }
    );

    // Increment course enrollment count
    const boughtCourse: ICourse | null = await Course.findById(courseId);

    if (!boughtCourse) {
      return NextResponse.json({
        success: false,
        message: 'Course not found'
      }, { status: 404 });
    }

    if (!boughtCourse.enrolledStudents?.some(s => s.user.toString() === userId.toString())) {
      boughtCourse.enrolledStudents = boughtCourse.enrolledStudents || [];
      boughtCourse.enrolledStudents.push({ user: userId });
      await boughtCourse.save();
    }
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      orderId: order._id
    }, { status: 200 });

  } catch (error: unknown) {
    logger.error(error, 'Error verifying payment');

    // Try to mark order as failed if possible
    try {
      const { orderId } = await request.json();
      const order = await Order.findOne({ razorpayOrderId: orderId });
      if (order) {
        order.status = 'failed';
        order.paymentResult = {
          id: orderId,
          status: 'failed',
          update_time: new Date().toISOString(),
          failure_reason: error.message
        };
        await order.save();
      }
    } catch (updateError: any) {
      logger.error(updateError, 'Failed to update order status');
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      message: `Payment verification failed: ${message}`,
      error: error.message
    }, { status: 500 });
  }
}