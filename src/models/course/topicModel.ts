
import { ITopic } from "@/types/model";
import mongoose ,{Schema,Model}from "mongoose";

const topicSchema: Schema<ITopic> = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  topic: { type: String, required: true, index: true },
  description: { type: String, required: true }
}, { timestamps: true });

const Topic: Model<ITopic> = mongoose.models.Topic || mongoose.model<ITopic>('Topic', topicSchema);
export default Topic;
