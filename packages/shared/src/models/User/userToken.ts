import mongoose, { Schema, Model } from 'mongoose';
import { IUserToken } from '../../types/model.types';



export const UserTokenSchema: Schema<IUserToken> = new mongoose.Schema({
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
    },
    isUsed: {
        type: Boolean,
        default: false
    }

},
    { timestamps: true }
)



const UserToken: Model<IUserToken> = mongoose.models.UserToken || mongoose.model<IUserToken>('UserToken', UserTokenSchema);
export default UserToken;