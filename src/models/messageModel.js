import mongoose from 'mongoose';

export const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Adjust this to match your User model name
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
      type: String, // Optional: consider using Number if it’s numeric
    },
    isReadByInstructor: Boolean, // New field
    isReadByStudent: Boolean, // New field
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

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
export default Message;