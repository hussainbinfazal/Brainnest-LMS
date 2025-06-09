    import mongoose from 'mongoose';
    

    export const paymentsSchema = new mongoose.Schema({
        amount: {
            type: Number,
            required: true,
        },
        paymentId: {
            type:String
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

    const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentsSchema);
    export default Payment;