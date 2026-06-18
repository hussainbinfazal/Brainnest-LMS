import mongoose from "mongoose";
import { EnrollmentStatus } from "./Enums";
const enrollmentSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    price: { type: Number, required: true },
    status: { type: String, enum: Object.values(EnrollmentStatus), default: EnrollmentStatus.Unenrolled },
    enrolledAt: { type: Date, }
}, { timestamps: true });
enrollmentSchema.index({ courseId: 1, userId: 1 }, { unique: true });
// indexing for the admin queries to get the latest enrolled students for a course
enrollmentSchema.index({ courseId: 1, enrolledAt: -1 });
const Enrollment = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;
