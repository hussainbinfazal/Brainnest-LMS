import mongoose from 'mongoose';
export const categorySchema = new mongoose.Schema({
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
}, { timestamps: true });
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
export default Category;
