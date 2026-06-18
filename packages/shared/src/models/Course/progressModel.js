import mongoose from "mongoose";
const progressSchema = new mongoose.Schema({
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
    completedLessonsCount: {
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
}, { timestamps: true });
progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
const Progress = mongoose.models.Progress || mongoose.model("Progress", progressSchema);
export default Progress;
