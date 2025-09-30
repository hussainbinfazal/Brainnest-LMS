// models/Review.js
import { IReview } from "@/types/model";
import mongoose ,{Model,Schema} from "mongoose";



const reviewSchema: Schema<IReview> = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rating: { type: Number, required: true },
  comment: { type: String },
}, { timestamps: true });

const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);
export default Review;
