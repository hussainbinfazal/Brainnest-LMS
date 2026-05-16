// models/Course.js
import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  description: { type: String },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  price: { type: Number, required: true },
  rating: { type: Number, default: 0, index: true },
  coverImage: { type: String, required: true },
  tags: [{ type: String }],
  status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
  isPaid: { type: Boolean, default: false },
  discount: { type: Number, default: 0 },
  duration: { type: Number },
  language: { type: String, default: 'English' },
  level: { type: String, enum: ['beginner', 'intermediate', 'expert'], default: 'beginner' },
  certificate: { type: Boolean, default: false },
  video: { type: String },
  previewVideo: { type: String },

  category: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true }
  },

  requirements: [{ type: String }],
  whatYouWillLearn: [{ type: String }],
  faq: [{ question: String, answer: String }]
}, { timestamps: true, strictPopulate: false });

// Compound index for filtering and sorting by category + rating + status
courseSchema.index({ "category._id": 1, rating: -1, status: 1 });

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);
export default Course;
