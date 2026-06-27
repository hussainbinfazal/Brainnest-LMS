import mongoose, { Schema, Model } from "mongoose";
import { IUserCourse } from "src/types";

const userCourseSchema: Schema<IUserCourse> = new mongoose.Schema({
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
    isLiked: {
        type: Boolean,
        default: false
    },
    isEnrolled: {
        type: Boolean,
        default: false
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    progress: {
        type: Number,
        default: 0
    },
    likedAt: {
        type: Date,
        default: Date.now
    },
    enrolledAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

userCourseSchema.index({ userId: 1, courseId: 1 }, { unique: true })

const UserCourse: Model<IUserCourse> = mongoose.models.UserCourse || mongoose.model<IUserCourse>('UserCourse', userCourseSchema);
export default UserCourse;