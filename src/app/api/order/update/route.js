import Order from "@/models/orderModel";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { NextResponse } from "next/server";


export async function PUT(req) {
    try {

        const { orderId, status } = await req.json();

        const user = await getDataFromToken(req);
        const userId = user.id || user._id ;
        const order = await Order.findById(orderId);

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
        if(order.status === 'completed') {
            return NextResponse.json({
                success: true,
                message: 'Order completed successfully',
                orderId: order._id
            });
        }
        if(order.status === 'failed') {
            return NextResponse.json({
                success: true,
                message: 'Order Failed',
                orderId: order._id
            });
        }
        if(order.status === 'pending') {
            return NextResponse.json({
                success: true,
                message: 'Order is still pending',
                orderId: order._id
            });
        }
        
        
    } catch (error) {
        console.error("Error in PUT request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}