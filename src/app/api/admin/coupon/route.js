import { NextResponse } from "next/server";
import Cart from "@/models/cartModel";
import { connectDB } from "@/config/db";
import Coupon from "@/models/couponModel";
import { getDataFromToken } from "@/utils/getDataFromToken";

export async function POST(request) {
    await connectDB();
    try {
        const user = await getDataFromToken(request);
        const { code, discount, expiresAt, usageLimit } = await request.json();
        const exitingCoupon = await Coupon.findOne({ code: code });
        const userId = user._id || user.id;
        if (!userId) return NextResponse.json({ message: "User id is required" }, { status: 400 });
        if (exitingCoupon) {
            return NextResponse.json({ message: "Coupon already exists" }, { status: 400 });
        }
        const newCoupon = new Coupon({ code, discount, expiresAt, usageLimit, createdBy: userId });
        await newCoupon.save();
        return NextResponse.json({ message: "Coupon created successfully", newCoupon }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ message: "There is a error on the server side" }, { status: 500 });
    }
}


export async function GET(request) {
    await connectDB();
    try {
        const coupons = await Coupon.find().populate("createdBy", "name email");
        return NextResponse.json(coupons);
    } catch (error) {
        return NextResponse.json({ message: "There is a error on the server side" }, { status: 500 });
    }
}


export async function DELETE(request) {
    try {
        const user = await getDataFromToken(request);
        const userId = user._id || user.id;
        const { couponId, } = await request.json();
        if (!couponId) return NextResponse.json({ message: "Coupon id is required" }, { status: 400 });
        if (!userId) return NextResponse.json({ message: "User id is required" }, { status: 400 });
        const coupon = await Coupon.findByIdAndDelete(couponId);
        return NextResponse.json({ message: "Coupon deleted successfully", coupon }, { status: 200 });
    } catch (error) {
        console.log("This is the error on the backend", error)
        return NextResponse.json({ message: "There is a error on the server side" }, { status: 500 });
    }
}

export async function PUT(request) {
    await connectDB();
    try {
        const { couponId, editForm } = await request.json();
        const { code, discount, expiresAt, usageLimit } = editForm;
        const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, { code, discount, expiresAt, usageLimit }, { new: true });
        return NextResponse.json({ message: "Coupon updated successfully", updatedCoupon }, { status: 200 });
    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: "There is a error on the server side" }, { status: 500 });
    }
}