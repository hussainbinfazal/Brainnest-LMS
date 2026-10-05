import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from '@repo/shared/server';
import { Coupon, ICoupon, ISessionUser, validateMongooseId } from '@repo/shared/server';
import { logger } from "@repo/shared/server";
import { CustomNextRequest } from "../../../../../types/server";
import { auth } from "@/auth";
import { Session } from "next-auth";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";
import { ADMIN_COUPON_IP_KEY, checkIp } from "@repo/shared/server";

const createCouponBodySchema = z.object({
    code: z.string(),
    discountValue: z.number(),
    discountType: z.string(),
    expiresAt: z.union([z.string(), z.date()]),
    maxUses: z.number(),
});
const deleteCouponBodySchema = z.object({ couponId: z.string() });
const updateCouponBodySchema = z.object({
    couponId: z.string(),
    data: z.object({
        code: z.string(),
        discountValue: z.number(),
        discountType: z.string(),
        expiresAt: z.union([z.string(), z.date()]),
        isActive: z.boolean(),
        maxUses: z.number(),
    }),
});
export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, ADMIN_COUPON_IP_KEY.namespace, ADMIN_COUPON_IP_KEY.max, ADMIN_COUPON_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    await connectDB(process.env.MONGODB_URI!);
    try {
        const session: Session | null = await auth()
        if (!session) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = session?.user;
        if (!user) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);

        const userId: string = user?.id;
        const body = await parseBody(request, createCouponBodySchema);
        if (!body.ok) return body.response;
        const { code, discountValue, discountType, expiresAt, maxUses } = body.data;
        const existingCoupon = await Coupon.findOne({ code: code });
        if (!userId || !validateMongooseId({ userId })) return failResponse({ message: "User id is required" }, 400, undefined, undefined, true);
        if (existingCoupon) {
            return failResponse({ message: "This Coupon is already exists" }, 400, undefined, undefined, true);
        }
        const newCoupon = new Coupon({ code, discountValue, discountType, expiresAt, maxUses, createdBy: userId }).exec();
        await newCoupon.save();
        logger.info("Coupon created successfully");
        return successResponse({ message: "Coupon created successfully", newCoupon }, 201, undefined, undefined, true);

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in creating coupon: ${message}`);
        return failResponse({ message: `Error in creating coupon:${message}` }, 500, undefined, undefined, true);
    }
}


export async function GET(request: CustomNextRequest): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, ADMIN_COUPON_IP_KEY.namespace, ADMIN_COUPON_IP_KEY.max, ADMIN_COUPON_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    try {
        const session: Session | null = await auth()
        if (!session) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = session?.user;
        if (!user) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        await connectDB(process.env.MONGODB_URI!);
        const coupons: ICoupon[] | null = await Coupon.find().populate("createdBy", "name email").exec();
        logger.info("Coupons retrieved successfully");
        return successResponse(coupons, 200, undefined, undefined, true);
    } catch (error: unknown) {
        const message: string = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in getting coupons: ", { message });
        return failResponse({ message }, 500, undefined, undefined, true);
    }
}


export async function DELETE(request: CustomNextRequest): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, ADMIN_COUPON_IP_KEY.namespace, ADMIN_COUPON_IP_KEY.max, ADMIN_COUPON_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    try {
        const session: Session | null = await auth()
        if (!session) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = session?.user;
        if (!user || validateMongooseId({ userId: user.id })) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const userId: string = user?.id;
        const body = await parseBody(request, deleteCouponBodySchema);
        if (!body.ok) return body.response;
        const { couponId } = body.data;
        await connectDB(process.env.MONGODB_URI!);
        const [isValidCouponId, isUserValid] = await Promise.all([
            validateMongooseId({ couponId: couponId }),
            validateMongooseId({ userId: userId })
        ]);
        if (!couponId || !isValidCouponId) return failResponse({ message: "Coupon id is required" }, 400, undefined, undefined, true);
        if (!userId || !isUserValid) return failResponse({ message: "User id is required" }, 400, undefined, undefined, true);
        const coupon: ICoupon | null = await Coupon.findByIdAndDelete(couponId);
        logger.info("Coupon deleted successfully");
        return successResponse({ message: "Coupon deleted successfully" }, 200, undefined, undefined, true);

    } catch (error: unknown) {
        const message: string = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in deleting coupon:", { message });
        return failResponse({ message }, 500, undefined, undefined, true);
    }
}

export async function PUT(request: CustomNextRequest): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, ADMIN_COUPON_IP_KEY.namespace, ADMIN_COUPON_IP_KEY.max, ADMIN_COUPON_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    try {
        const body = await parseBody(request, updateCouponBodySchema);
        if (!body.ok) return body.response;
        const { couponId, data } = body.data;
        const { code, discountValue, discountType, expiresAt, isActive, maxUses } = data;
        if (!code || !discountValue || !discountType || !expiresAt || !maxUses || !isActive) {
            return failResponse({ message: "All fields are required" }, 400, undefined, undefined, true);
        }
        if (!couponId || !validateMongooseId({ couponId })) return failResponse({ message: "Coupon id is required and should be valid" }, 400, undefined, undefined, true);
        const session: Session | null = await auth()
        if (!session) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = session?.user;
        if (!user || validateMongooseId({ userId: user.id })) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const userId: string = user?.id;
        if (!userId || !validateMongooseId({ userId })) return failResponse({ message: "User id is required and should be valid" }, 400, undefined, undefined, true);
        await connectDB(process.env.MONGODB_URI!);
        const updatedCoupon: ICoupon | null = await Coupon.findByIdAndUpdate(couponId, { code, discountValue, expiresAt, discountType, maxUses, isActive }, { new: true });
        logger.info("Coupon updated successfully");
        return successResponse({ message: "Coupon updated successfully", updatedCoupon }, 200, undefined, undefined, true);
    } catch (error: unknown) {

        const message: string = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in updating coupon: ${message}`);
        return failResponse({ message: `Error in updating coupon:${message}` }, 500, undefined, undefined, true);
    }
}