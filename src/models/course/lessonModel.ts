
import { ILesson } from "@/types/model";
import mongoose,{Schema,Model} from "mongoose";

const lessonSchema:Schema<ILesson> = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  name: { type: String, required: true },
  video: { type: String, required: true },
  description: { type: String },
  duration: { type: Number, required: true },
  status: { type: String, enum: ['completed','incomplete'], default: 'incomplete' }
}, { timestamps: true });

const Lesson: Model<ILesson> = mongoose.models.Lesson || mongoose.model<ILesson>('Lesson', lessonSchema);
export default Lesson;
