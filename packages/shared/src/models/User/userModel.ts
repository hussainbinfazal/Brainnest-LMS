import { IUser } from "@repo/shared";
import mongoose, { Schema, Model } from "mongoose";

export const userSchema: Schema<IUser> = new mongoose.Schema({
    name: {
        type: 'String',
        required: true,
        trim: true

    },
    email: {
        type: 'String'
        , required: true
        , unique: true
        , lowercase: true
        , trim: true
        , index: true
    },
    password: {
        type: 'String', required: true, select: false
    },
    phoneNumber: {
        type: 'String'

    },
    profileImage: {
        type: 'String'
    },
    isVerified: {
        type: Boolean,
        default: false,
        index: true
    },
    role: {
        type: String,
        enum: ['student', 'admin', 'instructor'],
        default: 'student',
        index: true
    },

}, { timestamps: true });

userSchema.index({ role: 1, createdAt: -1 });
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default User;