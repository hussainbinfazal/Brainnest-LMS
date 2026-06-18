import mongoose from "mongoose";
const topicSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true, unique: true, trim: true },
    slug: { type: String, required: true, index: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });
const Topic = mongoose.models.Topic || mongoose.model('Topic', topicSchema);
export default Topic;
