import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { connectDB } from '@/config/db';
import User from '@/models/userModel';
import Order from '@/models/orderModel';
import Course from '@/models/course/courseModel';
import Payment from '@/models/paymentModel';
export async function POST(request) {


  try {
    await connectDB();

    const { orderId, paymentId, signature, courseId, userId, amount } = await request.json();
    
    console.log('Payment verification request data:');
    console.log('- orderId:', orderId);
    console.log('- paymentId:', paymentId);
    console.log('- courseId:', courseId);
    console.log('- userId:', userId);
    console.log('- amount:', amount);

    // Verify Razorpay signature
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === signature;

    // Update order in database
    const order = await Order.findOne({ razorpayOrderId: orderId });

    if (!order) {
      return NextResponse.json({
        success: false,
        message: 'Order not found'
      }, { status: 404 });
    }

    if (!isAuthentic) {
      // Mark order as failed for invalid signature
      order.status = 'failed';
      order.paymentResult = {
        status: 'failed',
        update_time: new Date().toISOString(),
        failure_reason: 'Invalid payment signature'
      };
      await order.save();
      
      return NextResponse.json({
        success: false,
        message: 'Invalid payment signature'
      }, { status: 400 });
    }

    const payment = new Payment({
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
      id: paymentId,
      status: 'completed',
      update_time: new Date().toISOString()
    };
    order.status = 'completed';

    await payment.save();
    await order.save();

    // Add course to user's enrolled courses
    console.log('Looking for user with ID:', userId);
    console.log('User ID type:', typeof userId);
    
    const user = await User.findById(userId);
    console.log('Found user:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('User not found in database for ID:', userId);
      return NextResponse.json({
        success: false,
        message: `User not found for ID: ${userId}`
      }, { status: 404 });
    }
    
    console.log('User enrolledCourses before:', user.enrolledCourses);

    if (!user.enrolledCourses?.includes(courseId)) {
      user.enrolledCourses = user.enrolledCourses || [];
      user.enrolledCourses.push(courseId);
      await user.save();
    }

    // Increment course enrollment count
    const boughtCourse = await Course.findById(courseId);
    
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

  } catch (error) {
    console.log(error)
    console.error('Error verifying payment:', error);
    
    // Try to mark order as failed if possible
    try {
      const { orderId } = await request.json();
      const order = await Order.findOne({ razorpayOrderId: orderId });
      if (order) {
        order.status = 'failed';
        order.paymentResult = {
          status: 'failed',
          update_time: new Date().toISOString(),
          failure_reason: error.message
        };
        await order.save();
      }
    } catch (updateError) {
      console.error('Failed to update order status:', updateError);
    }
    
    return NextResponse.json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    }, { status: 500 });
  }
}