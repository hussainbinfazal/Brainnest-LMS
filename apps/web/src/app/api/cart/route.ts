import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { getClientIp } from "@repo/shared/utils/getClientIp";
import { NextRequest, NextResponse } from "next/server";
import { Cart, connectDB, User, logger, validateMongooseId } from '@repo/shared/server';
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