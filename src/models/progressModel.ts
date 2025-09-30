import { IProgress } from "@/types/model";
import mongoose, { Schema,Document, Model, Types } from "mongoose";



const progressSchema: Schema<IProgress> = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    completedLessons: [
      {
        type: String,
      },
    ],
    completedCourses: [
      {
        type: String, 
      },
    ],
  },
  { timestamps: true }
);

const Progress: Model<IProgress> =
  mongoose.models.Progress || mongoose.model<IProgress>("Progress", progressSchema);
export default Progress;