import { NextResponse } from 'next/server';
import { connectDB } from '@/config/mongoDB/db';
import Payment from '@/models/Payment/paymentModel';
import { IPayments } from '@/types/model';
import { logger } from '@/utils/logger/logger';

export async function GET(): Promise<NextResponse> {
    try {
        await connectDB();
        const payments: IPayments[] | null = await Payment.find({}).lean().sort({ createdAt: -1 });
        return NextResponse.json({ success: true, payments }, { status: 200 });
    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in getting payments: ${message}`);
        return NextResponse.json({ success: false, message: `Error in getting payments:${message}` }, { status: 500 });
    }
}