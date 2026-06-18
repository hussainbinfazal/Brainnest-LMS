// import crypto from 'crypto';
// import { NextRequest, NextResponse } from 'next/server';
// import { connectDB, User, userCourse, Order, Course, Payment, Cart } from '@repo/shared';
// import { ICourse, IOrder, IUser } from '@/types/model';
// import mongoose from 'mongoose';
// import { logger } from "@/utils/logger/logger.node";
// export async function POST(request: NextRequest): Promise<NextResponse> {
//     try {
//         await connectDB(process.env.MONGODB_URI!);

//         const { orderId, paymentId, signature, cartId, userId, amount } = await request.json();

//         // Verify Razorpay signature
//         const body: string = orderId + '|' + paymentId;
//         const expectedSignature: string = crypto
//             .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
//             .update(body.toString())
//             .digest('hex');

//         const isAuthentic: boolean = expectedSignature === signature;

//         if (!isAuthentic) {
//             return NextResponse.json({
//                 success: false,
//                 message: 'Invalid payment signature'
//             }, { status: 400 });
//         }

//         // Update order in database
//         const order: IOrder | null = await Order.findOne({ razorpayOrderId: orderId });
//         if (!order) return NextResponse.json({
//             success: false,
//             message: 'Order not found'
//         }, { status: 404 });
//         const payment = new Payment({
//             amount,
//             paymentAt: new Date(),
//             paymentBy: userId,
//             paymentId: paymentId,
//             paymentOf: order._id,
//             paymentOnModel: 'Course',
//         });

//         order.isPaid = true;
//         order.paidAt = new Date();
//         order.paymentResult = {
//             id: paymentId,
//             status: 'completed',
//             update_time: new Date().toISOString()
//         };
//         order.status = 'completed';

//         await payment.save();
//         await order.save();

//         // Add courses to user's enrolled courses using UserCourse model
//         const user: IUser | null = await User.findById(userId);
//         if (!user) return NextResponse.json({
//             success: false,
//             message: 'User not found'
//         }, { status: 404 });

//         // Check if any course already purchased using UserCourse model
//         const enrolledCoursesList = await userCourse.find({
//             userId: new mongoose.Types.ObjectId(userId),
//             isEnrolled: true
//         });

//         const enrolledCourseIds = enrolledCoursesList.map(uc => uc.courseId.toString());

//         const hasAlreadyPurchased = order.orderItems.some((item) =>
//             enrolledCourseIds.includes(item.course._id.toString())
//         );

//         if (hasAlreadyPurchased) {
//             return NextResponse.json({
//                 success: false,
//                 message: 'Some courses already purchased'
//             }, { status: 400 });
//         }

//         // Add all courses from order to UserCourse model
//         const courseIds: mongoose.Types.ObjectId[] = order.orderItems.map((item) => item.course);
//         for (const courseId of courseIds) {
//             await UserCourse.findOneAndUpdate(
//                 {
//                     userId: new mongoose.Types.ObjectId(userId),
//                     courseId: new mongoose.Types.ObjectId(courseId)
//                 },
//                 {
//                     isEnrolled: true,
//                     enrolledAt: new Date()
//                 },
//                 { upsert: true }
//             );
//         }

//         // Increment course enrollment count
//         for (const item of order.orderItems) {
//             if (item.course) {
//                 // Add course to user's enrolled courses

//                 // Update course enrollment count
//                 const course = await Course.findById(item.course._id).populate<{ enrolledCourses: ICourse[] }>("enrolledCourses enrolledStudents enrollmentCount");
//                 if (course) {
//                     course.enrolledCount += 1;
//                     course.enrolledStudents.push({ user: userId });
//                     await course.save();
//                     logger.info({ course: course.title, enrolledCount: course.enrolledCount }, 'Course enrollment updated');
//                 }
//             }
//         }

//         await Cart.findOneAndDelete({ user: userId });

//         await user.save();

//         return NextResponse.json({
//             success: true,
//             message: 'Payment verified successfully',
//             orderId: order._id
//         }, { status: 200 });

//     } catch (error: any) {
//         logger.error(error);
//         logger.error('Error verifying payment:', error);
//         const message = error instanceof Error ? error.message : 'Unknown error';
//         return NextResponse.json({
//             success: false,
//             message: `Payment verification failed: ${message}`,
//             error: error.message
//         }, { status: 500 });
//     }
// }