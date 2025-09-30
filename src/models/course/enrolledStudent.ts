
import { IEnrollment } from "@/types/model";
import mongoose ,{Schema,Model} from "mongoose";

const enrollmentSchema : Schema<IEnrollment> = new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    enrolledAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Enrollment : Model<IEnrollment> = mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
export default Enrollment;
