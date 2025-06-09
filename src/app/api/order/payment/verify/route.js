import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { connectDB } from '@/config/db';
import User from '@/models/userModel';
import Order from '@/models/orderModel';
import Course from '@/models/courseModel';
import Payment from '@/models/paymentModel';
export async function POST(request) {


  try {
    await connectDB();

    const { orderId, paymentId, signature, courseId, userId,amount } = await request.json();

    // Verify Razorpay signature
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === signature;

    if (!isAuthentic) {
      return NextResponse.json({
        success: false,
        message: 'Invalid payment signature'
      }, { status: 400 });
    }

    // Update order in database
    const order = await Order.findOne({ razorpayOrderId: orderId });

    const payment = new Payment({
      amount,
      paymentAt: new Date(),
      paymentBy: userId,
      paymentId: paymentId,
      paymentOf: order._id,
      paymentOnModel: 'Course',
    });
    if (!order) {
      return NextResponse.json({
        success: false,
        message: 'Order not found'
      }, { status: 404 });
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentResult = {
      id: paymentId,
      status: 'completed',
      update_time: new Date().toISOString()
    };
    order.status = 'completed';

    await payment.save();
    await order.save();

    // Add course to user's enrolled courses
    const user = await User.findById(userId);

    if (!user.enrolledCourses.includes(courseId)) {
      user.enrolledCourses?.push(courseId);
      await user.save();
    };

    // Increment course enrollment count
    const boughtCourse = await Course.findById(courseId);

    if (!boughtCourse.enrolledStudents.some(s => s.user.toString() === userId.toString())) {
      boughtCourse.enrolledStudents.push({ user: userId });
      await boughtCourse.save();
    }
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      orderId: order._id
    }, { status: 200 });

  } catch (error) {
    console.log(error)
    console.error('Error verifying payment:', error);
    return NextResponse.json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    }, { status: 500 });
  }
}