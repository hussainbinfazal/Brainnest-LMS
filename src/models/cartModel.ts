import { ICart } from "@/types/model";
import mongoose, { Schema, Model} from "mongoose";



export const cartSchema: Schema<ICart> = new mongoose.Schema({
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


const Cart: Model<ICart> = mongoose.models.Cart || mongoose.model<ICart>('Cart', cartSchema);
export default Cart;