import { NextRequest, NextResponse } from "next/server";
import Cart from "@/models/Cart/cartModel";
import Order from "@/models/Cart/orderModel";
import { connectDB } from "@/config/mongoDB/db";
import User from "@/models/User/userModel";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { logger } from "@/utils/logger/logger.node";
import Razorpay from 'razorpay';
import Course from '@/models/Course/courseModel';
import { ISessionUser, RazorpayCreateOrderRequest, MyRazorpayOrder } from "@/types/server";

import { ICart, IOrder } from "@/types/model";

const razorpay = new (Razorpay as any)({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const user: ISessionUser | null = await getDataFromToken(request);
        const userId: string | null = user?.id || "";
        const cartInDB: ICart | null = await Cart.findOne({ user: userId });
        if (!cartInDB) return NextResponse.json({ message: "Cart not found" }, { status: 404 });

        const shortReceipt: string = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const amount: number = Math.round(cartInDB.total);
        const razorpayOptions: RazorpayCreateOrderRequest = {
            amount: amount * 100, // Convert to paisa
            currency: 'INR',
            receipt: shortReceipt
        };

        const razorpayOrder: Awaited<ReturnType<typeof razorpay.orders.create>> = await razorpay.orders.create(razorpayOptions);

        const order: IOrder | null = new Order({
            user: userId,
            orderItems: cartInDB.courses.map(courseId => ({
                course: courseId._id || courseId  // In case course is a populated object or just ID
            })),
            totalPrice: amount,
            paymentMethod: 'Razorpay',
            razorpayOrderId: razorpayOrder.id,
            status: 'pending'
        });
        await order.save();
        return NextResponse.json({
            message: "Course purchased successfully", razorpayOrder, orderId: order._id,
            razorpayOrderId: razorpayOrder.id,
            amount: amount, order
        }, { status: 200 });

    } catch (error: any) {
        logger.error(error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `Internal Server Error: ${message}` }, { status: 500 });
    }
}