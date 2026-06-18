import mongoose from "mongoose";
const sectionSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    order: {
        type: Number,
        required: true
    }
}, { timestamps: true });
sectionSchema.index({ courseId: 1, order: 1 }, { unique: true });
const Section = mongoose.models.Section || mongoose.model('Section', sectionSchema);
export default Section;
