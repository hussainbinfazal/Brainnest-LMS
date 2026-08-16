import mongoose, { Schema } from "mongoose";
import { ILessonCompletion } from "src/types";

const lessonCompletionSchema = new mongoose.Schema<ILessonCompletion>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  sectionId: { type: Schema.Types.ObjectId, ref: "Section", required: true },
  lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", required: true },
  completedAt: { type: Date, default: Date.now },
});

lessonCompletionSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
lessonCompletionSchema.index({ userId: 1, sectionId: 1 }); // per-section progress
lessonCompletionSchema.index({ userId: 1, courseId: 1 });

const lessonCompletion: mongoose.Model<ILessonCompletion> = mongoose.models.LessonCompletion || mongoose.model<ILessonCompletion>("LessonCompletion", lessonCompletionSchema);
export default lessonCompletion;