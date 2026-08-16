import mongoose, { Document, HydratedDocument, Types } from "mongoose";

export interface ICourse {
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

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  parent: Types.ObjectId;

}
export interface IEnrollment {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  userId: Types.ObjectId;
  paymentId?: Types.ObjectId;
  price: number;
  status: string;
  enrolledAt: Date;
}
export interface ILesson {
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
export interface IReview {
  _id: Types.ObjectId;
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
export interface ITopic {
  _id: Types.ObjectId;
  name: string;
  description: string;
  slug: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface ICart {
  _id: Types.ObjectId
  user: Types.ObjectId;
  courses: (Types.ObjectId | ICourse)[];
  subTotal: number;
  discount: number;
  tax: number;
  total: number;
}
export interface IChat {
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

export interface IPaymentsByUser {
  _id: Types.ObjectId;
  amount: number;
  paymentId: Types.ObjectId;
  paymentAt: Date;
  paymentBy: Types.ObjectId;
  paymentOf: Types.ObjectId;
  paymentOnModel: 'Course' | 'Chat';
  paymentStatus: 'pending' | 'completed' | 'failed';
}
export interface ICoupon {
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
export interface ICouponUsage {
  _id: Types.ObjectId;
  coupon: Types.ObjectId;
  user: Types.ObjectId;
  order: Types.ObjectId;
  usedAt: Date;
}
export interface IMessage {
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
export interface IOrder {
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

export interface IPayments {
  _id: Types.ObjectId;
  amount: number;
  paymentId: string;
  paymentAt: Date;
  paymentBy: Types.ObjectId;
  paymentOf: Types.ObjectId;
  paymentOnModel: 'Course' | 'Chat' | 'Order';
  paymentStatus: 'Pending' | 'Completed' | 'Failed';

}
export interface IProgress {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  sectionProgress: {
    sectionId: Types.ObjectId;
    completedCount: number;
    totalLessons: number;
  }
  completedLessonsCount: number;
  percentageCompleted: number;
  lastAccessedAt: Date;
}

export interface ILessonCompletion {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  sectionId: Types.ObjectId;
  lessonId: Types.ObjectId;
  completedAt: Date;
}
export interface IUser {
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

export interface ICertificate {
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
export interface IUserToken {
  userId: Types.ObjectId;
  type: 'reset' | 'verification' | 'refresh';
  token: string;
  expiresAt: Date;
  isVerified: boolean;
  isUsed: boolean
}

export interface IUserCourse {
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

export interface ICategory {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  parent: Types.ObjectId;
}

export interface ISection {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  order: number;
}


export type CourseDocument = HydratedDocument<ICourse>;
export type CategoryDocument = HydratedDocument<ICategory>;
export type EnrollmentDocument = HydratedDocument<IEnrollment>;
export type LessonDocument = HydratedDocument<ILesson>;
export type ReviewDocument = HydratedDocument<IReview>;
export type TopicDocument = HydratedDocument<ITopic>;
export type CartDocument = HydratedDocument<ICart>;
export type ChatDocument = HydratedDocument<IChat>;
export type PaymentsByUserDocument = HydratedDocument<IPaymentsByUser>;
export type CouponDocument = HydratedDocument<ICoupon>;
export type CouponUsageDocument = HydratedDocument<ICouponUsage>;
export type MessageDocument = HydratedDocument<IMessage>;
export type OrderDocument = HydratedDocument<IOrder>;
export type PaymentsDocument = HydratedDocument<IPayments>;
export type ProgressDocument = HydratedDocument<IProgress>;
export type UserDocument = HydratedDocument<IUser>;
export type CertificateDocument = HydratedDocument<ICertificate>;
export type UserTokenDocument = HydratedDocument<IUserToken>;
export type UserCourseDocument = HydratedDocument<IUserCourse>;
export type SectionDocument = HydratedDocument<ISection>;