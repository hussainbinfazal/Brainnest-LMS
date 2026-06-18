import mongoose from 'mongoose';
export const couponUsageSchema = new mongoose.Schema({
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        required: true, index: true,
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
}, { timestamps: true });
const CouponUsage = mongoose.models.Coupon || mongoose.model('Coupon', couponUsageSchema);
export default CouponUsage;
