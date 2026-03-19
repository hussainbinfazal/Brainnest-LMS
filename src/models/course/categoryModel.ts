import { ICategory } from '@/types/model';
import mongoose, { Schema, Model } from 'mongoose';


export const categorySchema = new mongoose.Schema<ICategory>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    }
},
    { timestamps: true }
)


const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema);
export default Category;