import { NextRequest, NextResponse } from "next/server";
import { Cart, connectDB, User, logger, validateMongooseId } from "@repo/shared";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { CustomNextRequest, ISessionUser } from "@/types/server";
;

export async function GET(request: CustomNextRequest): Promise<NextResponse> {
    await connectDB(process.env.MONGODB_URI!);
    // logger.debug('Fetch cart controller called');
    try {
        const user: ISessionUser | null = await getDataFromToken(request);
        let userId = user?.id;
        const isUserIdValid = validateMongooseId({ userId: userId });
        const [cartDB] = await Promise.all([
            Cart.findOne({ user: userId }).populate("courses").lean()
        ])
        if (!user || !isUserIdValid) return NextResponse.json({ message: "Unauthorized", ip: request.ip }, { status: 401 });
        
        if (!cartDB) return NextResponse.json({ message: "Cart is empty" });
        return NextResponse.json(cartDB,{ status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in Fetching Cart",{error});
        return NextResponse.json({ message: `Internal Server Error:${message}` }, { status: 500 });
    }
};  