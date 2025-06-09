import mongoose from "mongoose";



export const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    courses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',

        }
    ],
    subTotal: {
        type: Number,
        default: 0,
        min: 0,
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
    },
    tax: {
        type: Number,
        default: 0,
        min: 0,
    },
    total: {
        type: Number,
        default: 0,
        min: 0,
    }

}, { timestamps: true });


const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
export default Cart;