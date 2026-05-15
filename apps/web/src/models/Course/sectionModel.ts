import { ISection } from "@/types/model";
import mongoose, { Schema, Model } from "mongoose";




const sectionSchema = new mongoose.Schema<ISection>({
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
}, { timestamps: true })



sectionSchema.index({ courseId: 1, order: 1 }, { unique: true });

const Section: Model<ISection> = mongoose.models.Section || mongoose.model<ISection>('Section', sectionSchema);
export default Section; 