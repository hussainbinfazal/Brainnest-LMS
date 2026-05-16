
import { ITopic } from "@/types/model";
import mongoose, { Schema, Model } from "mongoose";


const topicSchema= new mongoose.Schema<ITopic>({
  name: { type: String, required: true, index: true, unique: true, trim: true },
  slug: { type: String, required: true, index: true, unique: true, lowercase: true, trim: true },
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

const Topic: Model<ITopic> = mongoose.models.Topic || mongoose.model<ITopic>('Topic', topicSchema);
export default Topic;
