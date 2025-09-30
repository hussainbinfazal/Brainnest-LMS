import { Document, Types } from "mongoose";

export interface ICourse extends Document {
  title: string;
  topics: {
    topic: string;
    description: string;
  }[];
  description: string;
  instructor: Types.ObjectId;
  price: number;
  rating: number;
  enrolledStudents: {
    user: Types.ObjectId;
    enrolledAt: Date;
  }[];
  lessons: {
    _id: string;
    name: string;
    video: string;
    description: string;
    duration: number;
    createdAt: Date;
    updatedAt: Date;
    status: "completed" | "incomplete";
  }[];
  reviews: {
    _id: string;
    user: Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
  coverImage: string;
  tags: string[];
  status: "draft" | "published";
  isPaid: boolean;
  discount: number;
  duration: number;
  language: string;
  level: "beginner" | "intermediate" | "expert";
  certificate: boolean;
  faq: {
    question: string;
    answer: string;
  }[];
  requirements: string[];
  whatYouWillLearn: string[];
  video: string;
  previewVideo: string;
  category: {
    name: string;
    subCategories: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}
export interface IEnrollment extends Document {
  course: Types.ObjectId;
  user: Types.ObjectId;
  enrolledAt: Date;
}
export interface ILesson extends Document {
  course: Types.ObjectId;
  name: string;
  video: string;
  description: string;
  duration: number;
  status: string;
}
export interface IReview extends Document {
  course: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface ITopic extends Document {
  course: Types.ObjectId;
  topic: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface ICart extends Document {
    user: Types.ObjectId;
    courses: Types.ObjectId[];
    subTotal: number;
    discount: number;
    tax: number;
    total: number;
}
export interface IChat extends Document {
    isPaid: boolean;
    isLimitExceeded: boolean;
    isRenewed: boolean;
    isActive: boolean;
    allMessages: Types.ObjectId[];
    sender: Types.ObjectId;
    receiver: Types.ObjectId;
    isFromAdmin: boolean;
    messageLimit: number;
    messageCount: number;
    messageRemaining: number;
    totalInterval: number;
    totalSessions: number;
    userId: Types.ObjectId;
    paymentMethod: string;
    razorpayChatId: string;
    paymentResult: {
        id: string;
        status: string;
        update_time: string;
        email_address: string;
    };
    paymentsByUser: IPayments[];
    lastMessage: string;
    lastMessageAt: Date;
    unreadCount: number;
    instructorUnreadCount: number;
    studentUnreadCount: number;
}

export interface IPayments extends Document {
    amount: number;
    paymentId: Types.ObjectId;
    paymentAt: Date;
    paymentBy: Types.ObjectId;
}
interface ICoupon extends Document{
    code: string;
    discount: number;
    expiresAt: Date;
    usageLimit: number;
    usedCount: number;
    usedBy: Types.ObjectId[];
    createdBy: Types.ObjectId;
}
interface IMessage extends Document{
    sender:Types.ObjectId;
    receiver: Types.ObjectId;
    message: string;
    messageofTheLimit: string;
    isReadByInstructor: boolean;
    isReadByStudent: boolean;
    senderType: string;
    isDeleted: boolean;
    isDeletedByReceiver: boolean;
    isDeletedBySender: boolean;
}
interface IOrder extends Document{
    user: Types.ObjectId;
    orderItems: {
        course: Types.ObjectId;
    }[];
    paymentMethod: string;
    razorpayOrderId: string;
    paymentResult: {
        id: string;
        status: string;
        update_time: string;
        email_address: string;
    };
    totalPrice: number;
    sPaid: boolean;
    status: string;
    paidAt: Date;
}

export interface IPayment extends Document {
    amount: number;
    paymentId: string;
    paymentAt: Date;
    paymentBy: Types.ObjectId;
    paymentOf: Types.ObjectId;
    paymentOnModel: string;
}
export interface IProgress extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  completedLessons: string[];
  completedCourses: string[];
}

 export interface IUser extends Document {name: string;
    email: string;
    password: string;
    phoneNumber: string;
    profileImage: string;
    likedCourses: Types.ObjectId[];
    enrolledCourses: Types.ObjectId[];
    role: string;
    completedCourses: Types.ObjectId[];
    resetPasswordToken: string | null;
    resetPasswordTokenExpires: Date | null;
    verificationToken: string | null;
    verificationTokenExpires: Date | null;
    isResetTokenVerified: boolean;
    certificates: {
    courseId: Types.ObjectId;
    certificateUrl: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
    }