import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { IProgress } from "src/types";




const progressSchema = new mongoose.Schema<IProgress>(
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
        lessonId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Lesson",
        },
        progress: {
          type: Number,
          default: 0
        },
        isCompleted: {
          type: Boolean,
          default: false
        }
      },
    ],
    completedLessonsCount: 
      {
        type: Number,
        default: 0,
      },
    
    percentageCompleted: {
      type: Number,
      default: 0,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },

  }, 
  { timestamps: true }
);

progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const Progress: Model<IProgress> =
  mongoose.models.Progress || mongoose.model<IProgress>("Progress", progressSchema);
export default Progress;