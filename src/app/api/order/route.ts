import { NextRequest, NextResponse } from "next/server";
import Order from "@/models/Cart/orderModel";
import { connectDB } from "@/config/mongoDB/db";
import { getDataFromToken } from "@/utils/getDataFromToken";
import Cart from "@/models/Cart/cartModel";
import { ISessionUser } from "@/types/server";
import { ICart, ICourse } from "@/types/model";
import mongoose from "mongoose";
export async function POST(request: NextRequest): Promise<NextResponse> {
    await connectDB();

    try {
        const user: ISessionUser | null = await getDataFromToken(request);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 403 });
        }

        const cart: ICart | null = await Cart.findOne({ user: user?.id }).populate("cartItems");
        if (!cart || cart.courses.length === 0) {
            return NextResponse.json({ message: "Cart is empty" }, { status: 400 });
        }

        const body = await request.json();
        const { shippingAddress, paymentMethod, paymentResult } = body;

        if (!shippingAddress || !paymentMethod) {
            return NextResponse.json({ message: "Shipping and payment info required" }, { status: 400 });
        }

        const orderItems = cart.courses.map((courseId: mongoose.Types.ObjectId | ICourse) => ({
            Course: courseId._id || courseId,
        }));


        const order = new Order({
            user: user?.id,
            orderItems,
            shippingAddress,
            paymentMethod,
            paymentResult,
            totalPrice: cart.total,
            isPaid: false,
        });

        await order.save();
        await Cart.findOneAndDelete({ user: user.id });

        return NextResponse.json({ message: "Order created successfully", order }, { status: 200 });
    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Order creation failed:`, error);
        return NextResponse.json({ message: `Server error:${message}` }, { status: 500 });
    }
}