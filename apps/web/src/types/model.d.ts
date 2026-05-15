import { Document, Types } from "mongoose";

export interface ICourse extends Document {
  _id: Types.ObjectId;
  title: string;
  topic: Types.ObjectId | ITopic;
  description: string;
  instructorId: Types.ObjectId | IUser;
  price: number;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: number[];
  totalLessons: number;
  coverImage: string;
  tags: string[];
  status: "draft" | "published";
  isPaid: boolean;
  discount: number;
  totalDurationInSeconds: number;
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
  category: ICategory;
  subCategory: ICategory;
  sections: ISection[];
  dripType: string;
  totalEnrolledCount: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  parent: Types.ObjectId;

}
export interface IEnrollment extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  userId: Types.ObjectId;
  paymentId?: Types.ObjectId;
  pricePaid: number;
  enrolledAt: Date;
}
export interface ILesson extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  name: string;
  videoUrl: string;
  sectionId: Types.ObjectId;
  description: string;
  durationInSeconds: number;
  isPreview: boolean;
  isPreviewVideo?: string;
  order: number;
}
export interface IReview extends Document {
  _id: string;
  course: Types.ObjectId;
  user?: Types.ObjectId | IUser;
  rating: number;
  comment: string;
  spamScore: number;
  status: "clean" | "suspicious" | "spam";
  ipAdress: string;
  score: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
}
export interface ITopic extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  slug: string;
  isActive: booelan
  createdAt: Date;
  updatedAt: Date;
}
export interface ICart extends Document {
  _id: Types.ObjectId
  user: Types.ObjectId;
  courses: (Types.ObjectId | ICourse)[];
  subTotal: number;
  discount: number;
  tax: number;
  total: number;
}
export interface IChat extends Document {
  _id: Types.ObjectId;
  isPaid: boolean;
  isLimitExceeded: boolean;
  isRenewed: boolean;
  isActive: boolean;
  allMessages: mongoose.Types.Array<mongoose.Types.ObjectId>;
  sender: Types.ObjectId | IUser;
  receiver: Types.ObjectId | IUser;
  isFromAdmin: boolean;
  messageLimit: number;
  messageCount: number;
  messageRemaining: number;
  totalInterval: number;
  totalSessions: number;
  userId: Types.ObjectId;
  paymentMethod: string;
  razorpayChatId: string;
  paidAt: Date;
  paymentResult: {
    id: string;
    status: string;
    update_time: string;
    email_address?: string;
  };
  paymentsByUser: IPaymentsByUser[];
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  instructorUnreadCount: number;
  studentUnreadCount: number;
}

export interface IPaymentsByUser extends Document {
  _id: Types.ObjectId;
  amount: number;
  paymentId: Types.ObjectId;
  paymentAt: Date;
  paymentBy: Types.ObjectId;
  paymentOf: Types.ObjectId;
  paymentOnModel: 'Course' | 'Chat';
  paymentStatus: 'pending' | 'completed' | 'failed';
}
interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  discountValue: number;
  discountType: 'percentage' | 'fixed';
  expiresAt: Date;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  createdBy: Types.ObjectId;

}
interface ICouponUsage extends Document {
  _id: Types.ObjectId;
  coupon: Types.ObjectId;
  user: Types.ObjectId;
  order: Types.ObjectId;
  usedAt: Date;
}
interface IMessage extends Document {
  _id: Types.ObjectId;
  sender: Types.ObjectId;
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
interface IOrder extends Document {
  _id: Types.ObjectId;
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
    email_address?: string;
    failure_reason?: string;
  };
  totalPrice: number;
  isPaid: boolean;
  status: string;
  paidAt: Date;
}

export interface IPayments extends Document {
  _id: Types.ObjectId;
  amount: number;
  paymentId: string;
  paymentAt: Date;
  paymentBy: Types.ObjectId;
  paymentOf: Types.ObjectId;
  paymentOnModel: 'Course' | 'Chat';
  paymentStatus: 'pending' | 'completed' | 'failed';

}
export interface IProgress extends Document {
  _id: string;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  completedLessons: [{
    lessonId: Types.ObjectId;
    progress: number;
    isCompleted: boolean
  }];
  completedLessonsCount: number;
  percentageCompleted: number;
  lastAccessedAt: Date;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  profileImage: string;
  role: 'student' | 'admin' | 'instructor';
  isVerified: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface ICertificate extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  courseName: string;
  instructorName: string;
  completionDate: Date;
  certificatePreview: string;
  pdfUrl: string;
  generatedAt: Date;
  verificationCode: string;
  isRevoked: boolean;


}
export interface IUserToken extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: 'reset ' | 'verification' | 'refresh';
  token: string;
  expiresAt: Date;
  isVerified: boolean;
  isUsed: boolean
}
export interface IUserCourse extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  isLiked: boolean;
  isEnrolled: boolean;
  isCompleted: boolean;
  progress: number;
  likedAt: Date;
  enrolledAt: Date;
  completedAt: Date;

}

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  parent: Types.ObjectId;
}

export interface ISection {
  _id: Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  order: number;
}