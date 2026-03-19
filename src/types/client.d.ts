import React, { ReactNode } from "react";
import { ICourse, IUser } from "./model";
import { LucideIcon } from "lucide-react";

export interface CCertificate {
  _id: string;
  courseId: string;
  courseName?: string;
  instructorName?: string;
  completionDate?: string;
  certificatePreview?: string;
  pdfData?: string; // Base64 encoded PDF
  generatedAt?: Date;
}

export interface CAuthUser {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  profileImage?: string;
  imageUrl?: string;
  firstName?: string;
  role: 'student' | 'admin' | 'instructor';
  isVerified: boolean;
  likedCourses?: string[] | CCourse[];
  enrolledCourses: string[] | CCourse[];
  completedCourses?: string[] | CCourse[];
  createdAt?: Date;
  updatedAt?: Date;
}



export interface CChatMessage {
  role: 'user' | 'instructor';
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CPayment {
  _id?: string;
  amount: number;
  paymentId?: string;
  paymentAt?: Date;
  paymentBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
    phoneNumber?: string;
  } | string;
  paymentOf: string;
  paymentOnModel: 'Course' | 'Chat';
  createdAt?: Date;
  updatedAt?: Date;
}



export interface CChat {
  _id: string;
  isPaid: boolean;
  isLimitExceeded: boolean;
  isRenewed: boolean;
  isActive: boolean;
  allMessages: Message[];
  sender: {
    _id: string;
    name: string;
    profileImage: string;
  };
  receiver: {
    _id: string;
    name: string;
    profileImage: string;
  };
  isFromAdmin?: boolean;
  messageLimit: number;
  messageCount: number;
  messageRemaining: number;
  totalInterval: number;
  totalSessions: number;
  userId?: string;
  paymentMethod: string;
  razorpayChatId?: string;
  paymentResult?: {
    id?: string;
    _id?: string;
    status?: string;
    update_time?: string;
    email_address?: string;
  };
  paymentsByUser: Payment[];
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount?: number;
  instructorUnreadCount?: number;
  studentUnreadCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CMessage {
  _id?: string;
  sender: {
    _id: string;
    name: string;
    profileImage: string;
  };
  receiver: {
    _id: string;
    name: string;
    profileImage: string;
  };
  message: string;
  messageofTheLimit?: string;
  isReadByInstructor?: boolean;
  isReadByStudent?: boolean;
  senderinterface?: 'user' | 'instructor' | string;
  isDeleted?: boolean;
  isDeletedByReceiver?: boolean;
  isDeletedBySender?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CServerToClientEvents {
  message: (messageData: Message) => void;
  messageByAdmin: (messageData: Message) => void;
  userStatus: (status: { userId: string; status: 'online' | 'offline' }) => void;

}

// Events that the client sends to the server
export interface CClientToServerEvents {
  message: (messageData: Message) => void;
  messageByAdmin: (messageData: Message) => void;
  testEvent: (data: { hello: string }) => void;

}

export interface CChapter {
  time: number;
  title: string;
}

export interface CSubtitle {
  src: string;
  lang: string;
  label: string;
  default?: boolean;
}

export interface CQualityOption {
  label: string;
  src: string;
  selected?: boolean;
}

export interface CWatermark {
  text?: string;
  image?: string;
  position?: string;
}

export interface CVideoPlayerProps extends React.HTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
  title?: string;
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
  onTimeUpdate?: (current: number, duration: number) => void;
  playbackRates?: number[];
  autoplay?: boolean;
  controls?: boolean;
  fluid?: boolean;
  responsive?: boolean;
  aspectRatio?: string;
  hotkeys?: boolean;
  chapters?: Chapter[];
  subtitles?: Subtitle[];
  quality?: QualityOption[];
  analytics?: boolean;
  watermark?: Watermark | null;
}

export interface CChapter {
  title: string;
  time: number;
};
export interface CSubtitle {
  src: string;
  lang: string;
  label: string;
  default?: boolean;
};

export interface CQualityOption {
  label: string;
  src: string;
  selected?: boolean;
};

export interface CWatermark {
  text?: string;
  image?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
};


export interface CCategoriesSectionProps {
  categories: string[];
  isLoading: boolean;
}



const CCarouselOptions: EmblaOptionsinterface = {
  align: "start",
  loop: false,
  dragFree: true,
};
export interface CCategory {
  name: string;
  slug: string;
  isParent: string;
};

export interface CCourse {
  _id: string;
  title: string;
  description?: string;
  coverImage?: string;
  instructorId?: {
    _id: string;
    name?: string;
    profileImage?: string;
  };
  rating?: number;
  duration?: number;
  price?: number;
  isPaid?: boolean;
  discount?: number;
  level?: 'beginner' | 'intermediate' | 'expert';
  language?: string;
  status?: 'draft' | 'published';
  topics?: CTopic[];
  lessons?: CLesson[];
  reviews?: CReview[];
  enrolledStudents?: EnrolledStudent[];
  faq?: CFaq[];
  requirements?: string[];
  whatYouWillLearn?: string[];
  video?: string;
  previewVideo?: string;
  tags?: string[];
  category?: CCategory;
  published?: boolean;
  purchased?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CCourseShowcaseProps {
  courses: Course[];
  isLoading: boolean;
  title: string;
  subtitle: string;
  showViewAll?: boolean;
  formatRatingNumber: (num: number) => string;
  convertToTotalHours: (timeStr: string) => number;
}

// Temporary User interface for Reviews
export interface CReviewUser {
  name: string;
  profileImage?: string;
};


export interface CReview {
  _id?: string;
  rating: number;
  comment: string;
  user?: CReviewUser;
  text?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CTestimonialsSectionProps {
  reviews: Review[];
  fallbackCourses: any[];
}

export interface CLoadingBarLoaderProps {
  isLoading?: boolean;
  color?: string;
  className?: string;
}

export interface CStarRatingProps {
  rating: number;
  maxStars?: number;
}

// Footer.tsx
export interface CFooterProps {
  className?: string;
}
export interface CButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline" | "filled";
}

//Homepage
export interface CUserLocation {
  country_name: string;
  city?: string;
  [key: string]: any;
}

export interface COtpSenderProps {
  phoneNumber: string;
  setPhoneNumber: (number: string) => void;
  onOtpSent: () => void;
}
export interface CEmailOtpVerifierProps {
  email: string;

  phoneNumber: string;
  onVerified: () => void;
  onChangeNumber: () => void;
  onChangeEmail: () => void;
}
export interface CEmailOtpSenderProps {
  email: string;
  onOtpSent: () => void;
}

export interface CSendOtpResponse {
  message: string;
  otp?: string;

}
export interface CVerifyOtpResponse {
  message: string;
  // add other fields your API returns if needed
}
export interface CResendOtpResponse {
  otp: string;
  message: string;
  // add other fields your API returns if needed
}


export interface CProfileImageUploadProps {
  setValue?: (field: string, value: any) => void;
  trigger?: (field: string) => void;
  control?: any;
}

export interface CCourseRatingProps {
  courseId: string;
  userRating?: number;
}
export interface CCreateCouponResponse {
  code: string;
  discount: number | string;
  expiresAt: string;
  usageLimit: number | string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;

}

export interface CCoupon {
  _id: string;
  code: string;
  discount: number | string;
  expiresAt: string | Date | number;
  usageLimit: number | string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}


export interface CUpdateCouponResponse {
  updatedCoupon: Coupon;
}
export interface CDeleteCouponResponse {
  message: string;
}
export interface CfetchCouponsProps {
  coupons: Coupon[];
}

export interface CfetchCouponsResponse {
  coupons: Coupon[];
  total: number;
}

export interface CAuthStore {
  authUser: CAuthUser | null;
  userLoggedInitialized: boolean;
  hasInitialized: boolean;
  isAuthLoading: boolean;

  setAuthUser: (authUser: CAuthUser | null) => void;
  clearAuthUser: () => void;
  setAuthLoading: (loading: boolean) => void;
  setHasInitialized: (value: boolean) => void;
  setUserLoggedInitialized: (value: boolean) => void;
  fetchUser: () => Promise<void>;
}

export interface CCartStore {
  cart: Record<string, CartItem>; // key can be productId
  fetchCart: () => Promise<Record<string, CartItem> | void>;
}

export interface CCart {
  _id?: string;
  user?: CAuthUser | string;
  courses: (Course | string)[];
  subTotal: number;
  discount: number;
  tax: number;
  total: number;
  createdAt?: string;
  updatedAt?: string;
  coupon?: Coupon | null;
}
export interface CChatMessage {
  role: 'user' | 'instructor' | 'system';
  content: string;
}

export interface CChatStore {
  chat: CChatMessage[];
  setChat: (chat: ChatMessage[]) => void;
  addMessage?: (message: ChatMessage) => void;
  clearChat?: () => void;
}
export interface CCourseStore {
  courses: Course[];
  fetchCourses: () => Promise<Course[]>;
  setCourses?: (courses: Course[]) => void;

}


export interface CTopic {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;

};
export interface CFaq {
  question: string;
  answer: string;
}

export interface CLesson {
  _id?: string;
  courseId?: string;
  name: string;
  videoUrl: string;
  sectionId?: string;
  description: string;
  durationInSeconds: number;
  isPreview: boolean;
  isPreviewVideo?: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
  order: number;
  status?: 'completed' | 'incomplete';
};

export interface CSections {
  _id?: string,
  title: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt:string
}

export interface PaymentsResponse {
  payments: Payment[];
}

export interface EnrolledStudent {
  _id: string;
  user: User;
  instructor?: Instructor;
  enrolledAt: string;
}

export interface CEnrolledStudent {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  profileImage?: string;
  phoneNumber?: string;
  instructor?: {
    _id: string;
    name: string;
  };
  enrolledAt: string;
}

// Razorpay Interfaces
export interface CRazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface CRazorpayVerifyRequest {
  orderId: string;
  paymentId: string;
  signature: string;
  courseId?: string;
  chatId?: string;
  userId: string;
  sender?: any;
  receiver?: any;
}

export interface CRazorpayCreateOrderRequest {
  courseId?: string;
  chatId?: string;
  userId: string;
  amount: number | string;
  messageLimit?: string;
}

export interface CRazorpayOrderResponse {
  razorpayOrderId: string;
  razorpayChatId?: string;
  success: boolean;
  message?: string;
}

export interface CRazorpayVerifyResponse {
  success: boolean;
  message: string;
  paymentId?: string;
}

export interface CorderItem {
  course: ICourse | string;

}

export interface CpaymentResultS {
  id?: string;
  status?: string;
  update_time?: string;
  email_address?: string;
}
export interface COrder {
  _id?: string;
  user: CAuthUser | string;
  orderItems: CorderItem[];
  paymentMethod: string;
  razorpayOrderId: string;
  paymentResult: CpaymentResultS;
  totalPrice?: number;
  isPaid?: boolean;
  email_address?: string;
  status?: string;
  paidAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface CFeatureSection {
  icon: LucideIcon, title: string, description: string, color: string
}
