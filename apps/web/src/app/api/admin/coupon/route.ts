import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@repo/shared";
import { Coupon, ICoupon, ISessionUser, validateMongooseId } from "@repo/shared";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { logger } from "@/utils/logger/logger.node";
import { CustomNextRequest } from "../../../../types/server";

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    await connectDB(process.env.MONGODB_URI!);
    try {
        const user: ISessionUser | null = await getDataFromToken(request);
        if (!user) return NextResponse.json({ message: "Unauthorized", ip: request.ip }, { status: 401 });

        const userId: string = user?.id;
        const { code, discountValue, discountType, expiresAt, maxUses, } = await request.json();
        const existingCoupon = await Coupon.findOne({ code: code });
        if (!userId || !validateMongooseId({ userId })) return NextResponse.json({ message: "User id is required" }, { status: 400 });
        if (existingCoupon) {
            return NextResponse.json({ message: "This Coupon is already exists" }, { status: 400 });
        }
        const newCoupon = new Coupon({ code, discountValue, discountType, expiresAt, maxUses, createdBy: userId }).exec();
        await newCoupon.save();
        logger.info("Coupon created successfully");
        return NextResponse.json({ message: "Coupon created successfully", newCoupon }, { status: 201 });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in creating coupon: ${message}`);
        return NextResponse.json({ message: `Error in creating coupon:${message}` }, { status: 500 });
    }
}


export async function GET(request: CustomNextRequest): Promise<NextResponse> {
    await connectDB(process.env.MONGODB_URI!);
    try {
        const user: ISessionUser | null = await getDataFromToken(request);
        if (!user) return NextResponse.json({ message: "Unauthorized", ip: request.ip }, { status: 401 });
        const userId: string = user?.id;
        const coupons: ICoupon[] | null = await Coupon.find().populate("createdBy", "name email");
        logger.info("Coupons retrieved successfully");

        return NextResponse.json(coupons, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in getting coupons: ${message}`);
        return NextResponse.json({ message: `Error in getting coupons:${message}` }, { status: 500 });
    }
}


export async function DELETE(request: CustomNextRequest): Promise<NextResponse> {
    try {
        await connectDB(process.env.MONGODB_URI!);
        const user: ISessionUser | null = await getDataFromToken(request);
        if (!user || validateMongooseId({ userId: user.id })) return NextResponse.json({ message: "Unauthorized", ip: request.ip }, { status: 401 });
        const userId: string = user?.id;
        const { couponId, } = await request.json();
        const [isValidCouponId, isUserValid] = await Promise.all([
            validateMongooseId({ couponId: couponId }),
            validateMongooseId({ userId: userId })
        ]);
        if (!couponId || !isValidCouponId) return NextResponse.json({ message: "Coupon id is required" }, { status: 400 });
        if (!userId || !isUserValid) return NextResponse.json({ message: "User id is required" }, { status: 400 });
        const coupon: ICoupon | null = await Coupon.findByIdAndDelete(couponId);
        logger.info("Coupon deleted successfully");
        return NextResponse.json({ message: "Coupon deleted successfully", coupon }, { status: 200 });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in deleting coupon: ${message}`);
        return NextResponse.json({ message: `There is a error on the server side:${message}` }, { status: 500 });
    }
}

export async function PUT(request: CustomNextRequest): Promise<NextResponse> {
    await connectDB(process.env.MONGODB_URI!);
    try {
        const { couponId, editForm } = await request.json();
        if(!couponId || !validateMongooseId({ couponId })) return NextResponse.json({ message: "Coupon id is required and should be valid" }, { status: 400 });
         const user: ISessionUser | null = await getDataFromToken(request);
        if (!user || validateMongooseId({ userId: user.id })) return NextResponse.json({ message: "Unauthorized", ip: request.ip }, { status: 401 });
        const userId: string = user?.id;
        if (!userId || !validateMongooseId({ userId })) return NextResponse.json({ message: "User id is required and should be valid" }, { status: 400 });
        const { code, discountValue, discountType, expiresAt, maxUses } = editForm;
        if (!code || !discountValue || !discountType || !expiresAt || !maxUses) {
            return NextResponse.json({ message: "All fields are required" }, { status: 400 });
        }
        const updatedCoupon: ICoupon | null = await Coupon.findByIdAndUpdate(couponId, { code, discountValue, expiresAt, discountType, maxUses }, { new: true });
        logger.info("Coupon updated successfully");
        return NextResponse.json({ message: "Coupon updated successfully", updatedCoupon }, { status: 200 });
    } catch (error: unknown) {

        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in updating coupon: ${message}`);
        return NextResponse.json({ message: `Error in updating coupon:${message}` }, { status: 500 });
    }
}