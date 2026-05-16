// models/Review.js
import { IReview } from "@/types/model";
import mongoose, { Model, Schema } from "mongoose";



const reviewSchema = new mongoose.Schema<IReview>({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  spamScore: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["clean", "suspicious", "spam"],
    default: "clean"
  },
  ipAdress: { type: String },
  score: { type: Number, default: 0 }, // ⭐ IMPORTANT
}, { timestamps: true });
reviewSchema.index({ course: 1, createdAt: -1 });
reviewSchema.index({ course: 1, rating: -1 });
reviewSchema.index({ course: 1, user: 1 }, { unique: true });
const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);
export default Review;
