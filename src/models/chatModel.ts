import { IChat, IPayments } from '@/types/model';
import mongoose,{Schema,Model} from 'mongoose';



export const paymentsSchema:Schema<IPayments> = new mongoose.Schema({
    amount: {
        type: Number,
        
    },
    paymentId:{
        type:mongoose.Schema.Types.ObjectId
    },
    paymentAt:{
        type:Date
    },
    paymentBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }
},{timestamps:true})
export const chatSchema: Schema<IChat> = new mongoose.Schema({

    isPaid: {
        type: Boolean,
        default: false
    },
    isLimitExceeded: {
        type: Boolean,
        default: false
    },
    isRenewed: {
        type: Boolean,
        default: false
    },

    isActive: {
        type: Boolean,
        default: false
    },
    allMessages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }
    ],
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Adjust this to match your User model name
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Adjust this to match your User model name
        required: true
    },
    isFromAdmin: Boolean,
    messageLimit: {
        type: Number,
        default: 0
    },
    messageCount: {
        type: Number,
        default: 0
    },
    messageRemaining: {
        type: Number,
        default: 30
    },
    totalInterval: {
        type: Number,
        default: 0
    },
    totalSessions: {
        type: Number,
        default: 0
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Adjust this to match your User model name

    },
    paymentMethod: {
        type: String,
        required: true,
        default: 'Razorpay'
    },
    razorpayChatId: {
        type: String,

    },
    paymentResult: {
        id: String,
        status: String,
        update_time: String,
        email_address: String
    },
    paymentsByUser: [paymentsSchema],
    lastMessage: String,
    lastMessageAt: Date,
    unreadCount: Number, // For instructor
    // Add instructor-specific fields
    instructorUnreadCount: Number, // New messages from student
    studentUnreadCount: Number,
}, { timestamps: true })

const Chat: Model<IChat> = mongoose.models.Chat || mongoose.model<IChat>('Chat', chatSchema);
export default Chat;