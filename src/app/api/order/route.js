import { NextResponse } from "next/server";
import Order from "@/models/orderModel";
import { connectDB } from "@/config/db";
import { getDataFromToken } from "@/utils/getDataFromToken";
import User from "@/models/userModel";
import Cart from "@/models/cartModel";
import Payment from "@/models/paymentModel";
export async function POST(request) {
    await connectDB();

    try {
        const user = await getDataFromToken(request);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 403 });
        }

        const cart = await Cart.findOne({ user: user._id || user.id }).populate("cartItems");
        if (!cart || cart.cartItems.length === 0) {
            return NextResponse.json({ message: "Cart is empty" }, { status: 400 });
        }

        const body = await request.json();
        const { shippingAddress, paymentMethod, paymentResult } = body;

        if (!shippingAddress || !paymentMethod) {
            return NextResponse.json({ message: "Shipping and payment info required" }, { status: 400 });
        }

        const orderItems = cart.cartItems.map((courseId) => ({
            Course: courseId,
        }));

       
        const order = new Order({
            user: user._id,
            orderItems,
            shippingAddress,
            paymentMethod,
            paymentResult,
            totalPrice: cart.total,
            isPaid: false,
        });

        await order.save();
        await Cart.findOneAndDelete({ user: user._id || user.id });

        return NextResponse.json({ message: "Order created successfully", order }, { status: 200 });
    } catch (error) {
        console.error("Order creation failed:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}