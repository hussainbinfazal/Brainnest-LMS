import { NextResponse } from 'next/server';
import { connectDB } from '@/config/db';
import Payment from '@/models/paymentModel';

export async function GET() {
    try {
        await connectDB();
        const payments = await Payment.find({}).lean();
        return NextResponse.json({ success: true, payments }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}