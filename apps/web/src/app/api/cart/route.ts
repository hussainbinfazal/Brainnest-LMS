import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextRequest, NextResponse } from "next/server";
import { Cart, CART_IP_KEY, checkIp, connectDB, User, logger, validateMongooseId } from '@repo/shared/server';
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { auth } from "@/auth";
import { Session } from "next-auth";
;

export async function GET(request: CustomNextRequest): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, CART_IP_KEY.namespace, CART_IP_KEY.max, CART_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    await connectDB(process.env.MONGODB_URI!);
    // logger.debug('Fetch cart controller called');
    try {
        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = authSession?.user;
        let userId = user?.id;
        const isUserIdValid = validateMongooseId({ userId: userId });
        const [cartDB] = await Promise.all([
            Cart.findOne({ user: userId }).populate("courses").lean()
        ])
        if (!user || !isUserIdValid) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);

        if (!cartDB) return successResponse({ message: "Cart is empty" }, 200, undefined, undefined, true);
        return successResponse(cartDB, 200, undefined, undefined, true);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in Fetching Cart", { error });
        return failResponse({ message: `Internal Server Error:${message}` }, 500, undefined, undefined, true);
    }
};  