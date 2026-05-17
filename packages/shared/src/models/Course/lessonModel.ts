
import { ILesson } from "@repo/shared";
import mongoose, { Model } from "mongoose";

const lessonSchema = new mongoose.Schema<ILesson>({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  name: { type: String, required: true },
  videoUrl: { type: String, required: true },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true, index: true },
  description: { type: String },
  durationInSeconds: { type: Number, required: true },
  isPreview: { type: Boolean, default: false },
  isPreviewVideo: { type: String },
  order: { type: Number, required: true }
}, { timestamps: true });

const Lesson: Model<ILesson> = mongoose.models.Lesson || mongoose.model<ILesson>('Lesson', lessonSchema);
lessonSchema.index({ courseId: 1, order: 1 }, { unique: true });
export default Lesson;
