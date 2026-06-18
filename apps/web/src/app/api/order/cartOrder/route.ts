// import { NextRequest, NextResponse } from "next/server";
// import { Cart, Order, connectDB, User, logger, Course, validateMongooseId } from "@repo/shared";
// import {
//     RazorpayService,
//     PaymentService
// } from "@repo/payment";
// import { getDataFromToken } from "@/utils/getDataFromToken";
// import { ISessionUser, RazorpayCreateOrderRequest, MyRazorpayOrder } from "@/types/server";
// import { ICart, IOrder } from "@/types/model";
// import mongoose from "mongoose";
// const razorpayService = new RazorpayService();
// const paymentService = new PaymentService()

// export async function POST(request: NextRequest): Promise<NextResponse> {
//     await connectDB(process.env.MONGDB_URI!);
//     const session = await mongoose.startSession();
//     try {
//         const user: ISessionUser | null = await getDataFromToken(request);
//         const userId: string | null = user?.id || "";
//         if (!user || !validateMongooseId({ userId })) return NextResponse.json({ message: "User not found" }, { status: 403 });
//         const cartInDB = await Cart.findOne({ user: userId })
//             .lean()
//             .session(session);
//         if (!cartInDB) return NextResponse.json({ message: "Cart not found" }, { status: 404 });

//         const shortReceipt: string = paymentService.generateReceipt();
//         const amount: number = Math.round(cartInDB.total * 100);
//         if(amount <= 0) return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
//         const razorpayOrder = await razorpayService.createOrder({ amount, receipt: shortReceipt });
//         await session.startTransaction();

//         const order: IOrder | null = await Order.findOneAndUpdate({
//             user: userId,
//             status: 'pending'
//         }, {
//             user: userId,
//             orderItems: cartInDB.courses.map(courseId => ({
//                 course: courseId._id || courseId
//             })),
//             totalPrice: amount,
//             paymentMethod: 'Razorpay',
//             razorpayOrderId: razorpayOrder.id,
//             status: 'pending'
//         }, {
//             upsert: true,
//             new: true

//         }).session(session);
//         if (!order) {
//             await session.abortTransaction();
//             logger.error("Error in payment", { error: "Order not found" });
//             return NextResponse.json({ message: "Order not found" }, { status: 404 });
//         }
//         await session.commitTransaction();
//         return NextResponse.json({
//             message: "Course purchased successfully", razorpayOrder, orderId: order._id,
//             razorpayOrderId: razorpayOrder.id,
//             amount: amount, order
//         }, { status: 200 });

//     } catch (error: unknown) {
//         if (session.inTransaction()) {
//             await session.abortTransaction();
//         }
//         const message = error instanceof Error ? error.message : 'Unknown error';
//         logger.error("Error in creating order", { message });
//         return NextResponse.json({ message: `Internal Server Error` }, { status: 500 });
//     } finally {
//         await session.endSession();
//     }
// }


// Cart Order API can hit order create and verify logic, if you want cart functionality