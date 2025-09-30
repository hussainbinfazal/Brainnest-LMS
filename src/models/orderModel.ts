import { IOrder } from '@/types/model';
import mongoose,{Schema,Model, Types} from 'mongoose';



const orderItemSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  },
  { _id: false }
); 

const paymentResultSchema = new Schema(
  {
    id: { type: String },
    status: { type: String },
    update_time: { type: String },
    email_address: { type: String },
  },
  { _id: false }
);
   
export const orderSchema= new mongoose.Schema({
        user: {
            type:Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        orderItems: [orderItemSchema],
        
        paymentMethod: {
            type: String,
            required: true,
            default: 'Razorpay'
        },
        razorpayOrderId: {
            type: String,
            required: true
        },
        paymentResult: paymentResultSchema,
        totalPrice: {
            type: Number,
            required: true,
            default: 0.0
        },
        isPaid: {
            type: Boolean,
            required: true,
            default: false
        },
        status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
        paidAt: {
            type: Date
        },
    }, { timestamps: true }
    );
    const Order:Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);
    export default Order;