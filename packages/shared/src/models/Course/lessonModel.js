import mongoose from "mongoose";
const lessonSchema = new mongoose.Schema({
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
const Lesson = mongoose.models.Lesson || mongoose.model('Lesson', lessonSchema);
lessonSchema.index({ courseId: 1, order: 1 }, { unique: true });
export default Lesson;
