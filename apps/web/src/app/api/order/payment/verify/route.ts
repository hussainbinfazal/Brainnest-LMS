import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Payment, User, Course, userCourse, Order, logger, connectDB, Enrollment, validateMongooseId, PaymentsDocument, OrderDocument } from '@repo/shared';
import { ICourse, IOrder, IPayments, IUser } from '@/types/model';
import mongoose from 'mongoose';
import { markPaymentCompleted, PaymentService } from '@repo/payment';
const paymentService: PaymentService = new PaymentService();
export async function POST(request: NextRequest): Promise<NextResponse> {
  await connectDB(process.env.MONGODB_URI!);
  const session : mongoose.ClientSession = await mongoose.startSession();
  try {

    const { orderId, paymentId, signature, userId, amount } = await request.json();
    if (!orderId || !paymentId || !signature || !userId || !amount) {
      logger.warn('Invalid data');
      return NextResponse.json({ message: "Invalid data" }, { status: 400 })
    };
    if (!validateMongooseId({ orderId: orderId })) {
      logger.error("Invalid Order Id", { orderId });
      return NextResponse.json({ message: "Invalid Data" }, { status: 400 })
    };

    if (!validateMongooseId({ userId: userId })) {
      logger.error("Invalid User Id in payment", { userId });
      return NextResponse.json({ message: "Invalid Data" }, { status: 400 })
    };
    logger.info('Payment verification request data', { orderId, paymentId, userId, amount },)
    await session.startTransaction();;
    const [pendingOrder, pendingPayment] = await Promise.all([
      Order.findOne({ _id: orderId, status: 'Pending' }).session(session).exec(),
      Payment.findOne({ paymentId, paymentStatus: 'Pending' }).session(session).exec()
    ]);
    // Verify Razorpay signature

    if (!pendingPayment) {
      logger.error('Payment not found');
      return NextResponse.json({
        success: false,
        message: 'Payment not found'
      }, { status: 404 });
    }
    if (!pendingOrder) {
      await session.abortTransaction();
      logger.error('Order not found', { orderId });
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const isAuthentic : boolean = paymentService.verifyPayment(pendingPayment.paymentId, paymentId, signature);

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
      return NextResponse.json({
        success: false,
        message: 'Invalid payment signature'
      }, { status: 400 });


    }
    if (!pendingPayment) {
      await session.abortTransaction();
      logger.error('Payment not found', { paymentId });
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
    }

    const courseIds: mongoose.Types.ObjectId[] = pendingOrder.orderItems.map(item => item.course);

    if (!courseIds.length) {
      await session.abortTransaction();
      logger.error('Order has no courses', { orderId });
      return NextResponse.json({ message: 'Invalid order' }, { status: 400 });
    }
    const completedOrder : OrderDocument | null = await Order.findOneAndUpdate(
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

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully, Order Generated Successfully',
    }, { status: 200 });

  } catch (error: unknown) {
    if (session.inTransaction()) await session.abortTransaction();
    // Try to mark order as failed if possible
    const message : string = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error verifying payment', { message });
    return NextResponse.json({
      success: false,
      message: `Payment verification failed`,
    }, { status: 500 });
  } finally {
    await session.endSession();
  }
}