import { IPayments } from '@/types/model';
import mongoose, { Schema, Document, Model, Types } from 'mongoose';



export const paymentsSchema: Schema<IPayments> = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
    },
    paymentId: {
        type: String
    },
    paymentAt: {
        type: Date
    },
    paymentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    paymentOf: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'paymentOnModel'
    },
    paymentOnModel: {
        type: String,
        required: true,
        enum: ['Course', 'Chat']
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    }

}, { timestamps: true });

const Payment: Model<IPayments> = mongoose.models.Payment || mongoose.model<IPayments>('Payment', paymentsSchema);
export default Payment;