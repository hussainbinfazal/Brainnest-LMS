import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { connectDB } from '@/config/db';
import User from '@/models/userModel';
import Order from '@/models/orderModel';
import Course from '@/models/courseModel';
import Payment from '@/models/paymentModel';
import Cart from '@/models/cartModel';
export async function POST(request) {


    try {
        await connectDB();

        const { orderId, paymentId, signature, cartId, userId,amount } = await request.json();

        // console.log("This is the amount :", amount);
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

        const hasExisted = user.enrolledCourses.some((course) =>
            order.orderItems.some((item) =>
                course?._id.toString() === item.course?._id.toString()
            )
        );
        if (hasExisted) return NextResponse.json({
            success: false,
            message: 'Course already purchased'
        }, { status: 400 })

        if (!hasExisted) {
            user.enrolledCourses.push(order.orderItems.map((item) => item.course));
            await user.save();
        }

        // Increment course enrollment count
        for (const item of order.orderItems) {
            if (item.course) {
                // Add course to user's enrolled courses

                // Update course enrollment count
                const course = await Course.findById(item.course._id);
                if (course) {
                    course.enrollmentCount += 1;
                    course.enrolledStudents.push({ user: userId });
                    await course.save();
                    console.log('Course enrollment updated:', course.title, 'New count:', course.enrollmentCount);
                }
            }
        }

        const deletedcCart = await Cart.findOneAndDelete({user:userId});
        
        await user.save();

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