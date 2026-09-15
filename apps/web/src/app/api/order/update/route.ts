
import { auth } from "@/auth";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { connectDB, IOrder, Order } from "@repo/shared";
import { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";


export async function PUT(request: CustomNextRequest): Promise<NextResponse> {
    try {

        const { orderId, status } = await request.json();

        const authSession: Session | null = await auth()
        if (!authSession) return NextResponse.json({ message: "Unauthorized", ip: request.ip }, { status: 401 });
        const user: ISessionUser | null = authSession?.user;

        const userId: string | null = user?.id || '';
        await connectDB(process.env.MONGODB_URI!)
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