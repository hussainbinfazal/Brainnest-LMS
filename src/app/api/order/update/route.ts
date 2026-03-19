import Order from "@/models/Cart/orderModel";
import { IOrder } from "@/types/model";
import { ISessionUser } from "@/types/server";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { NextRequest, NextResponse } from "next/server";


export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {

        const { orderId, status } = await request.json();

        const user: ISessionUser | null = await getDataFromToken(request);
        const userId: string | null = user?.id || '';
        const order: IOrder | null = await Order.findById(orderId);

        if (!order) {
            return NextResponse.json({
                success: false,
                message: 'Order not found'
            }, { status: 404 });
        }

        if (order.user.toString() !== userId) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, { status: 401 });
        }
        order.status = status;
        await order.save();
        if (order.status === 'completed') {
            return NextResponse.json({
                success: true,
                message: 'Order completed successfully',
                orderId: order._id
            });
        }
        if (order.status === 'failed') {
            return NextResponse.json({
                success: true,
                message: 'Order Failed',
                orderId: order._id
            });
        }
        if (order.status === 'pending') {
            return NextResponse.json({
                success: true,
                message: 'Order is still pending',
                orderId: order._id
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Order updated successfully',
            orderId: order._id
        });

    } catch (error: any) {
        console.error("Error in PUT requestuest:", error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `Internal Server Error: ${message}` }, { status: 500 });
    }
}