import { IUserToken } from '@/types/model';
import mongoose, { Schema, Model } from 'mongoose';



export const userTokenSchema: Schema<IUserToken> = new mongoose.Schema({
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

},
    { timestamps: true }
)



const userToken: Model<IUserToken> = mongoose.models.userToken || mongoose.model<IUserToken>('userToken', userTokenSchema);
export default userToken;