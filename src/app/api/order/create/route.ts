import Razorpay from 'razorpay';
import { connectDB } from '@/config/mongoDB/db';
import User from '@/models/User/userModel';
import Order from '@/models/Cart/orderModel';
import Course from '@/models/Course/courseModel';
import { getDataFromToken } from '@/utils/getDataFromToken';
import { NextRequest, NextResponse } from 'next/server';
import { ISessionUser, RazorpayCreateOrderRequest } from '@/types/server';
import { ICourse, IOrder, IUser } from '@/types/model';

const razorpay = new (Razorpay as any)({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req: NextRequest) {
  await connectDB();

  try {
    const { courseId, amount } = await req.json();

    const user: ISessionUser | null = await getDataFromToken(req);
    const userId: string | null = user?.id || '';

    const course: ICourse | null = await Course.findById(courseId);
    const dbUser: IUser | null = await User.findById(userId);

    if (!course || !dbUser) {
      return NextResponse.json({ message: 'Course or user not found' }, { status: 404 });
    }

    const existingOrder: IOrder | null = await Order.findOne({
      user: userId,
      'orderItems.course': courseId,
      isPaid: true
    });

    if (existingOrder) {
      return NextResponse.json({ message: 'Course already purchased' }, { status: 400 });
    }

    const shortReceipt: string = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const razorpayOptions: RazorpayCreateOrderRequest = {
      amount: amount * 100, // Convert to paisa
      currency: 'INR',
      receipt: shortReceipt
    };

    const razorpayOrder: Awaited<ReturnType<typeof razorpay.orders.create>> = await razorpay.orders.create(razorpayOptions);

    const order: IOrder | null = new Order({
      user: userId,
      orderItems: [{
        course: courseId,
        price: amount
      }],
      totalPrice: amount,
      paymentMethod: 'Razorpay',
      razorpayOrderId: razorpayOrder.id,
      status: 'pending'
    });

    await order.save();

    return NextResponse.json({
      success: true,
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: amount
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error creating order:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      message: `Failed to create order: ${message}`,
      error: error.message
    }, { status: 500 });
  }
}