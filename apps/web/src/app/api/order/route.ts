import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/mongoDB/db";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import mongoose from "mongoose";
import { Session } from "next-auth";
import { auth } from "@/auth";
import { Cart, checkIp, ICart, ICourse, logger, ORDER_CREATE_CART_IP_KEY, Order } from '@repo/shared/server';
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";

const createCartOrderBodySchema = z.object({
    shippingAddress: z.record(z.string(), z.unknown()),
    paymentMethod: z.string(),
    paymentResult: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, ORDER_CREATE_CART_IP_KEY.namespace, ORDER_CREATE_CART_IP_KEY.max, ORDER_CREATE_CART_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    await connectDB();

    try {
        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = authSession?.user;
        if (!user) {
            return failResponse({ message: "User not found" }, 403, undefined, undefined, true);
        }

        const cart: ICart | null = await Cart.findOne({ user: user?.id }).populate("cartItems");
        if (!cart || cart.courses.length === 0) {
            return failResponse({ message: "Cart is empty" }, 400, undefined, undefined, true);
        }

        const parsedBody = await parseBody(request, createCartOrderBodySchema);
        if (!parsedBody.ok) return parsedBody.response;
        const { shippingAddress, paymentMethod, paymentResult } = parsedBody.data;

        if (!shippingAddress || !paymentMethod) {
            return failResponse({ message: "Shipping and payment info required" }, 400, undefined, undefined, true);
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

        return successResponse({ message: "Order created successfully", order }, 200, undefined, undefined, true);
    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Order creation failed:`, error);
        return failResponse({ message: `Server error:${message}` }, 500, undefined, undefined, true);
    }
}