import mongoose, { Schema, Model } from "mongoose";
import { ISection } from "src/types";




const sectionSchema = new mongoose.Schema<ISection>({ ////Order of sections in course 
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