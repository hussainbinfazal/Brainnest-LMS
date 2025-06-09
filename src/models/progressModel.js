import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
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
        type: String, // Using lesson._id (which is a string in your schema)
      },
    ],
    completedCourses: [
      {
        type: String, // Using course._id (which is a string in your schema)
      },
    ],
  },
  { timestamps: true }
);

const Progress =
  mongoose.models.Progress || mongoose.model("Progress", progressSchema);
export default Progress;