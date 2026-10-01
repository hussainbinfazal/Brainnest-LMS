import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextResponse } from 'next/server';
import { connectDB } from '@repo/shared/server';
import {Payment, IPayments} from '@repo/shared/server';
import { logger } from '@/utils/logger/logger.node';

export async function GET(): Promise<NextResponse> {
    try {
        await connectDB(process.env.MONGODB_URI!);
        const payments: IPayments[] | null = await Payment.find({}).lean().sort({ createdAt: -1 });
        logger.info("Payments retrieved successfully", { paymentCount: payments?.length || 0 });
        return successResponse({ success: true, payments }, 200, undefined, undefined, true);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in getting payments: ${message}`);
        return failResponse({ success: false, message: `Error in getting payments:${message}` }, 500, undefined, undefined, true);
    }
}