import { User, Order, Course, connectDB, validateMongooseId, logger, Enrollment, Payment } from '@repo/shared';
import { getDataFromToken } from '@/utils/getDataFromToken';
import { NextRequest, NextResponse } from 'next/server';
import { CustomNextRequest, ISessionUser, RazorpayCreateOrderRequest } from '@/types/server';
import { ICourse, IOrder, IUser } from '@/types/model';
import { PaymentService, RazorpayService } from '@repo/payment';
import mongoose from 'mongoose';

const razorpayService = new RazorpayService()
const paymentService = new PaymentService()

export async function POST(req: CustomNextRequest): Promise<NextResponse> {
  await connectDB(process.env.MONGDB_URI!);
  const session = await mongoose.startSession();

  try {
    const { courseId, amount } = await req.json();

    const user: ISessionUser | null = await getDataFromToken(req);
    const userId: string | null = user?.id || '';
    if (!user || !validateMongooseId({ userId })) {
      logger.warn(`Unauthorized access attempt from IP: ${req.ip}`);
      return NextResponse.json({ message: "User not found" }, { status: 403 })
    };
    if (!courseId || !validateMongooseId({ courseId })) return NextResponse.json({ message: "Invalid course id" }, { status: 400 });
    if (!amount || amount < 1) return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
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
      return NextResponse.json({ message: 'Course or user not found' }, { status: 404 });
    }


    if (existingOrder) {
      return NextResponse.json({ message: 'Course already purchased' }, { status: 400 });
    }

    const shortReceipt: string = paymentService.generateReceipt();

    const razorpayOrder = await razorpayService.createOrder({ amount, receipt: shortReceipt });

    await session.startTransaction();
    const [pendingPayment, newOrder, pendingEnrollment] = await Promise.all([
      Payment.findOneAndUpdate({
        paymentBy: userId,
        paymentStatus: 'Pending'
      },{
        amount,
        paymentBy: userId,
        paymentId: razorpayOrder.id,
        paymentOnModel: 'Course',
        paymentStatus: 'Pending'
      
      },{
        upsert:true,
        new:true
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
    await pendingPayment.save({session})



    if (!newOrder) {
      logger.error('Error in creating order');
      await session.abortTransaction();
      return NextResponse.json({ message: 'Internal server error, Try again' }, { status: 404 });
    }
    await session.commitTransaction();
    return NextResponse.json({
      success: true,
      orderId: newOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: amount
    }, { status: 200 });

  } catch (error: unknown) {
    if (session.inTransaction()) await session.abortTransaction();
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(message);
    return NextResponse.json({
      success: false,
      message: `Failed to create order`,
    }, { status: 500 });
  }
}