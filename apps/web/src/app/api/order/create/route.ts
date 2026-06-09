import { User, Order, Course, connectDB, validateMongooseId, logger } from '@repo/shared';
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
    if(!courseId || !validateMongooseId({ courseId })) return NextResponse.json({ message: "Invalid course id" }, { status: 400 });
    if(!amount || amount < 1) return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
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
    const order: IOrder | null = await Order.findOneAndUpdate({
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
    }).session(session);

    if (!order) {
      logger.error('Order not found in create order route');
      await session.abortTransaction();
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }
    await session.commitTransaction();
    return NextResponse.json({
      success: true,
      orderId: order._id,
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