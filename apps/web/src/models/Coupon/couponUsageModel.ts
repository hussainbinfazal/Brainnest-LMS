import { ICouponUsage } from '@/types/model';
import mongoose, { Schema, Model } from 'mongoose';
import { use } from 'react';


export const couponUsageSchema: Schema<ICouponUsage> = new mongoose.Schema({
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
        , required: true, index: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, index: true,
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',

    },
    usedAt: {
        type: Date,
        default: Date.now
    }
},
    { timestamps: true }
)

const CouponUsage: Model<ICouponUsage> = mongoose.models.Coupon || mongoose.model<ICouponUsage>('Coupon', couponUsageSchema);
export default CouponUsage;