import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { auth } from "@/auth";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { checkIp, IOrder, ORDER_UPDATE_IP_KEY, Order } from '@repo/shared/server';
import { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";


import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";

const updateOrderBodySchema = z.object({ orderId: z.string(), status: z.string() });

export async function PUT(request: CustomNextRequest): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, ORDER_UPDATE_IP_KEY.namespace, ORDER_UPDATE_IP_KEY.max, ORDER_UPDATE_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    try {

        const body = await parseBody(request, updateOrderBodySchema);
        if (!body.ok) return body.response;
        const { orderId, status } = body.data;

        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = authSession?.user;

        const userId: string | null = user?.id || '';
        await connectDB(process.env.MONGODB_URI!)
        const order: IOrder | null = await Order.findById(orderId);

        if (!order) {
            return failResponse({
                success: false,
                message: 'Order not found'
            }, 404, undefined, undefined, true);
        }

        if (order.user.toString() !== userId) {
            return failResponse({
                success: false,
                message: 'Unauthorized'
            }, 401, undefined, undefined, true);
        }
        order.status = status;
        await order.save();
        if (order.status === 'completed') {
            return successResponse({
                success: true,
                message: 'Order completed successfully',
                orderId: order._id
            }, 200, undefined, undefined, true);
        }
        if (order.status === 'failed') {
            return successResponse({
                success: true,
                message: 'Order Failed',
                orderId: order._id
            }, 200, undefined, undefined, true);
        }
        if (order.status === 'pending') {
            return successResponse({
                success: true,
                message: 'Order is still pending',
                orderId: order._id
            }, 200, undefined, undefined, true);
        }

        return successResponse({
            success: true,
            message: 'Order updated successfully',
            orderId: order._id
        }, 200, undefined, undefined, true);

    } catch (error: any) {
        console.error("Error in PUT requestuest:", error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return failResponse({ message: `Internal Server Error: ${message}` }, 500, undefined, undefined, true);
    }
}