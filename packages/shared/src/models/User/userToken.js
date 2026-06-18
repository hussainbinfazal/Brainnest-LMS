import mongoose from 'mongoose';
export const userTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['reset', 'verification', 'refresh'],
    },
    token: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });
const userToken = mongoose.models.userToken || mongoose.model('userToken', userTokenSchema);
export default userToken;
