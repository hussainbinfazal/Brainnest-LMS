import { IPayment } from '@/types/model';
import mongoose, { Schema, Document, Model,Types } from 'mongoose';



export const paymentsSchema: Schema<IPayment> = new mongoose.Schema({
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
    }
}, { timestamps: true });

const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', paymentsSchema);
export default Payment;