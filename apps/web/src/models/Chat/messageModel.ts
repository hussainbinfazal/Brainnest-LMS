import { IMessage } from '@/types/model';
import mongoose, {Schema,Model} from 'mongoose';


export const messageSchema:Schema<IMessage> = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Instructor', // Or also 'User' if it's peer-to-peer
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    messageofTheLimit: {
      type: String, 
    },
    isReadByInstructor: Boolean, 
    isReadByStudent: Boolean, 
    senderType: String,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isDeletedByReceiver: {
      type: Boolean,
      default: false,
    },
    isDeletedBySender: {
      type: Boolean,
      default: false,
    },

  },
  { timestamps: true }
);

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);
export default Message;