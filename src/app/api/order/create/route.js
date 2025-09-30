import Razorpay from 'razorpay';
import { connectDB } from '@/config/db';
import User from '@/models/userModel';
import Order from '@/models/orderModel';
import Course from '@/models/course/courseModel';
import { getDataFromToken } from '@/utils/getDataFromToken';
import { NextResponse } from 'next/server';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  await connectDB();

  try {
    const { courseId, amount } = await req.json();

    const user = await getDataFromToken(req);
    const userId = user._id || user.id;

    const course = await Course.findById(courseId);
    const dbUser = await User.findById(userId);

    if (!course || !dbUser) {
      return NextResponse.json({ message: 'Course or user not found' }, { status: 404 });
    }

    const existingOrder = await Order.findOne({
      user: userId,
      'orderItems.course': courseId,
      isPaid: true
    });

    if (existingOrder) {
      return NextResponse.json({ message: 'Course already purchased' }, { status: 400 });
    }

    const shortReceipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const razorpayOptions = {
      amount: amount * 100, // Convert to paisa
      currency: 'INR',
      receipt: shortReceipt
    };

    const razorpayOrder = await razorpay.orders.create(razorpayOptions);

    const order = new Order({
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

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    }, { status: 500 });
  }
}