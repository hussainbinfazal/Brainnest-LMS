import mongoose, { Schema } from "mongoose";
import { ILessonProgress } from "src/types";


const lessonProgressSchema = new mongoose.Schema<ILessonProgress>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  sectionId: { type: Schema.Types.ObjectId, ref: "Section", required: true },
  lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", required: true },
  status: {
    type: String,
    enum: ["in_progress", "completed"],
    default: "in_progress"
  },
  lastPositionSeconds: {
    type: Number,
    default: 0
  },
  progressPercentage:{
    type:Number,
    default:0
  },
  completedAt: { type: Date, default: Date.now },
});

lessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
lessonProgressSchema.index({ userId: 1, sectionId: 1 }); // per-section progress
lessonProgressSchema.index({ userId: 1, courseId: 1 });

const LessonProgress: mongoose.Model<ILessonProgress> = mongoose.models.LessonProgress || mongoose.model<ILessonProgress>("LessonProgress", lessonProgressSchema);
export default LessonProgress;