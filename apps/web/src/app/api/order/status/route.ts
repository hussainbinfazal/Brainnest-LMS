import { auth } from "@/auth";
import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { checkIp, checkUser, connectDB, ISessionUser, logger, Order, Payment, PAYMENT_STATUS_IP_KEY, PAYMENT_STATUS_USER_KEY } from "@repo/shared/server";
import { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// Next must never cache this route: its answer changes when the webhook settles
export const dynamic = "force-dynamic";


export const orderStatusQuerySchema = z.object({
    razorpayOrderId: z.string().min(1, { message: "Razorpay order id is required" }),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { allowed: ipAllowed, retryAfterSec, ip } = await checkIp(request, PAYMENT_STATUS_IP_KEY.namespace, PAYMENT_STATUS_IP_KEY.max, PAYMENT_STATUS_IP_KEY.windowSec);

        if (!ipAllowed) {
            logger.warn("Too many requests in order status route", { ip: ip });
            return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
        }
        const authSession: Session | null = await auth();
        const userInSession: ISessionUser | null = authSession?.user ?? null;
        if (!userInSession?.id)
            return failResponse(
                { message: "Unauthorized", ip: ip },
                401,
                undefined,
                undefined,
                true
            );
        const parsedQuery = orderStatusQuerySchema.safeParse({
            razorpayOrderId: request.nextUrl.searchParams.get("razorpayOrderId") ?? undefined,
        });
        if (!parsedQuery.success) {
            return failResponse({ message: "Invalid request data." }, 400, undefined, undefined, true);
        }

        const {
            allowed: isUserAllowed,
            retryAfterSec: retryAfter,
        } = await checkUser(
            userInSession.id,
            PAYMENT_STATUS_USER_KEY.namespace,
            PAYMENT_STATUS_USER_KEY.max,
            PAYMENT_STATUS_USER_KEY.windowSec
        );
        if (!isUserAllowed) {
            logger.warn("Too many requests in order status route", { user: userInSession.id });
            return failResponse(
                { message: "Too many requests" },
                429,
                undefined,
                { "Retry-After": String(retryAfter) },
                true
            );
        }
        await connectDB(process.env.MONGODB_URI!);
        const payment = await Payment.findOne({
            // Razorpay order id from the validated query
            razorpayOrderId: parsedQuery.data.razorpayOrderId,
            // Ownership check: users only see their own payments
            user: userInSession.id,
            // Fetch only the status field
        }).select("paymentStatus").lean().exec();
        // Unknown and not-yours give the same 404, so nothing leaks
        if (!payment) return failResponse({ message: "Payment not found" }, 404, undefined, undefined, true);
        // Already "Pending" | "Completed" | "Failed", so no string juggling
        return successResponse({ status: payment.paymentStatus }, 200, undefined, undefined, true);


    } catch (error: unknown) {
        logger.error("Error in order status route", { error: error instanceof Error ? error.message : "Unknown error" });
        return failResponse({ message: "Something went wrong" }, 500, undefined, undefined, true);
    }

}