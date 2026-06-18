import mongoose from 'mongoose';
export const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    discountValue: { type: Number, required: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage', required: true },
    expiresAt: { type: Date },
    maxUses: { type: Number },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });
const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
export default Coupon;
