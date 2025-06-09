import { NextResponse } from "next/server";
import Cart from "@/models/cartModel";
import { connectDB } from "@/config/db";
import User from '@/models/userModel';
import { getDataFromToken } from "@/utils/getDataFromToken";

export async function GET(request) {
    await connectDB();
    // console.log('Fetch cart controller called');
    try {
        const user = await getDataFromToken(request);
        let userId = user._id || user.id;
        const cart = await Cart.findOne({ user: userId }).populate("courses").lean();
        if (!cart) return NextResponse.json({ message: "Cart is empty" });
        return NextResponse.json(cart);
    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Internal Server Error", error }, { status: 500 });
    }
};  