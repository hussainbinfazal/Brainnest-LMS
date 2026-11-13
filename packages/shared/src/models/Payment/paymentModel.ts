import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { IPayments } from 'src/types';

export const paymentsSchema: Schema<IPayments> = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    ///RAZORPAY PAYMENT ID
    paymentId: {
      type: String,
    },
    paymentAt: {
      type: Date,
    },
    paymentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    paymentOf: {
      type: mongoose.Schema.Types.ObjectId, ///ChatId/ CourseId
      required: true,
      refPath: 'paymentOnModel',
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentOnModel: {
      type: String,
      required: true,
      enum: ['Course', 'Chat'],
    },
    reconcileCheckedAt: { type: Date, default: null },
    ///RAZORPAY ORDER ID
    razorpayOrderId: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed'],
      default: 'Pending',
    },
  },
  { timestamps: true },
);
// Index that matches the sweep query and sort

paymentsSchema.index({ paymentStatus: 1, reconcileCheckedAt: 1, createdAt: 1 });
const Payment: Model<IPayments> =
  mongoose.models.Payment ||
  mongoose.model<IPayments>('Payment', paymentsSchema);
export default Payment;
