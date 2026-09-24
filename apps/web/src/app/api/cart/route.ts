import { getClientIp } from "@repo/shared/utils/getClientIp";
import { NextRequest, NextResponse } from "next/server";
import { Cart, connectDB, User, logger, validateMongooseId } from "@repo/shared";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { auth } from "@/auth";
import { Session } from "next-auth";
;

export async function GET(request: CustomNextRequest): Promise<NextResponse> {
    const ip = getClientIp(request.headers);
    if (ip === 'unknown') logger.warn('OTP route: could not resolve client IP');
    await connectDB(process.env.MONGODB_URI!);
    // logger.debug('Fetch cart controller called');
    try {
        const authSession: Session | null = await auth()
        if (!authSession) return NextResponse.json({ message: "Unauthorized", ip: ip }, { status: 401 });
        const user: ISessionUser | null = authSession?.user;
        let userId = user?.id;
        const isUserIdValid = validateMongooseId({ userId: userId });
        const [cartDB] = await Promise.all([
            Cart.findOne({ user: userId }).populate("courses").lean()
        ])
        if (!user || !isUserIdValid) return NextResponse.json({ message: "Unauthorized", ip: ip }, { status: 401 });

        if (!cartDB) return NextResponse.json({ message: "Cart is empty" });
        return NextResponse.json(cartDB, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in Fetching Cart", { error });
        return NextResponse.json({ message: `Internal Server Error:${message}` }, { status: 500 });
    }
};  