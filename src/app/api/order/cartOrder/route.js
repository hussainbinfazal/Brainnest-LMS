import { NextResponse } from "next/server";
import Cart from "@/models/cartModel";
import Order from "@/models/orderModel";
import { connectDB } from "@/config/db";
import User from "@/models/userModel";
import { getDataFromToken } from "@/utils/getDataFromToken";
import Razorpay from 'razorpay';
import Course from '@/models/courseModel';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request, res) {
    try {
        await connectDB();
        const user = await getDataFromToken(request);
        const userId = user._id || user.id;
        const cartInDB = await Cart.findOne({ user: userId });
        if (!cartInDB) return NextResponse.json({ message: "Cart not found" }, { status: 404 });

        const shortReceipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const amount = Math.round(cartInDB.total);
        const razorpayOptions = {
            amount: amount * 100, // Convert to paisa
            currency: 'INR',
            receipt: shortReceipt
        };

        const razorpayOrder = await razorpay.orders.create(razorpayOptions);

        const order = new Order({
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
        return NextResponse.json({ message: "Course purchased successfully", razorpayOrder,orderId: order._id,
              razorpayOrderId: razorpayOrder.id,
              amount: amount,order }, { status: 200 });
        
    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}