import { NextResponse } from 'next/server';
import { connectDB } from '@repo/shared';
import {Payment, IPayments} from '@repo/shared';
import { logger } from '@/utils/logger/logger.node';

export async function GET(): Promise<NextResponse> {
    try {
        await connectDB(process.env.MONGODB_URI!);
        const payments: IPayments[] | null = await Payment.find({}).lean().sort({ createdAt: -1 });
        logger.info("Payments retrieved successfully", { paymentCount: payments?.length || 0 });
        return NextResponse.json({ success: true, payments }, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in getting payments: ${message}`);
        return NextResponse.json({ success: false, message: `Error in getting payments:${message}` }, { status: 500 });
    }
}