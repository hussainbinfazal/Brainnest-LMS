import mongoose, { Schema, Model } from 'mongoose';
import { ICertificate } from 'src/types';


export const certificateSchema = new mongoose.Schema<ICertificate>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true,
    },
    courseName: {
        type: String,
        required: true
    },
    instructorName: {
        type: String,
        required: true,
    },
    completionDate: {
        type: Date,
        default: Date.now,
    },
    pdfUrl:{
        type: String,
        required: true
    },
    certificatePreview:{
        type: String,
        required: true
    },
    verificationCode:{
        type: String,
        required: true,
        unique: true
    },
    isRevoked:{
        type: Boolean,
        default: false
    }
},
    { timestamps: true }
)

certificateSchema.index( // Ensure a user can only have one certificate per course at the time of parallel requests for certificate generation
  { userId: 1, courseId: 1 },
  { unique: true }
);

const Certificate: Model<ICertificate> = mongoose.models.certificate || mongoose.model<ICertificate>('Certificate', certificateSchema);
export default Certificate;