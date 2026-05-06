import { NextRequest, NextResponse } from "next/server";
import Cart from "@/models/Cart/cartModel";
import { connectDB } from "@/config/mongoDB/db";
import User from '@/models/User/userModel';
import { getDataFromToken } from "@/utils/getDataFromToken";
import { ISessionUser } from "@/types/server";
import { logger } from "@/utils/logger/logger.node";

export async function GET(request: NextRequest): Promise<NextResponse> {
    await connectDB();
    // logger.debug('Fetch cart controller called');
    try {
        const user: ISessionUser | null = await getDataFromToken(request);
        let userId = user?.id;
        const cart = await Cart.findOne({ user: userId }).populate("courses").lean();
        if (!cart) return NextResponse.json({ message: "Cart is empty" });
        return NextResponse.json(cart);
    } catch (error: any) {
        logger.error(error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `Internal Server Error:${message}` }, { status: 500 });
    }
};  