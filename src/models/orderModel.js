    import mongoose from 'mongoose';
    import Course from './courseModel';

    export const orderSchema = new mongoose.Schema({
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        orderItems: [{
            course: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course',
                required: true
            }
        }],
        
        paymentMethod: {
            type: String,
            required: true,
            default: 'Razorpay'
        },
        razorpayOrderId: {
            type: String,
            required: true
        },
        paymentResult: {
            id: String,
            status: String,
            update_time: String,
            email_address: String
        },
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
    const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
    export default Order;