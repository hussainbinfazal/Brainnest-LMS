export interface Certificate {
  courseId: string;
  courseName?: string;
  instructorName?: string;
  completionDate?: string;
  certificatePreview?: string;
  pdfData?: string; // Base64 encoded PDF
  generatedAt?: Date;
}

export interface AuthUser {
  _id?: string;
  name: string;
  email: string;
  password?: string; 
  phoneNumber?: string;
  profileImage?: string;
  imageUrl?: string; 
  firstName?: string;
  role: 'user' | 'admin' | 'instructor';
  likedCourses?: string[]; 
  enrolledCourses: string[]; 
  completedCourses?: string[]; 
  certificates: Certificate[]; 
  resetPasswordToken?: string | null;
  resetPasswordTokenExpires?: Date | null;
  verificationToken?: string | null;
  verificationTokenExpires?: Date | null;
  isResetTokenVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}



export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

import React, { ReactNode } from "react";

export interface Chapter {
  time: number;
  title: string;
}

export interface Subtitle {
  src: string;
  lang: string;
  label: string;
  default?: boolean;
}

export interface QualityOption {
  label: string;
  src: string;
  selected?: boolean;
}

export interface Watermark {
  text?: string;
  image?: string;
  position?: string;
}

export interface VideoPlayerProps extends React.HTMLAttributes<HTMLVideoElement> {
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

type Chapter = {
  title: string;
  time: number; 
};
type Subtitle = {
  src: string;        
  lang: string;       
  label: string;      
  default?: boolean;  
};

type QualityOption = {
  label: string;      
  src: string;        
  selected?: boolean; 
};

type Watermark = {
  text?: string;
  image?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
};


interface CategoriesSectionProps {
  categories: string[];
  isLoading: boolean;
}



const carouselOptions: EmblaOptionsType = {
  align: "start",
  loop: false,
  dragFree: true,
};


interface Course {
  _id: string;
  title: string;
  coverImage?: string;
  instructor?: { name: string };
  rating?: number;
  duration?: string;
  price?: number | string;
  reviews?: Review[];

   category?: { 
    name: string; 
    subCategories: string[]; 
  };
  description?: string;
  image?: string;
  published?: boolean;
  purchased?: boolean;
}

interface CourseShowcaseProps {
  courses: Course[];
  isLoading: boolean;
  title: string;
  subtitle: string;
  showViewAll?: boolean;
  formatRatingNumber: (num: number) => string;
  convertToTotalHours: (timeStr: string) => number;
}

export interface Review {
  _id?: string;
  rating: number; 
  comment: string; 
  user?: {
    name?: string;
    profileImage?: string;
  };
  text?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TestimonialsSectionProps {
  reviews: Review[];
  fallbackCourses: any[];
}

interface LoadingBarLoaderProps {
  isLoading?: boolean;
  color?: string;
  className?: string;
}

interface StarRatingProps {
  rating: number;
  maxStars?: number;
}

// Footer.tsx
interface FooterProps {
  className?: string;
}
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline" | "filled";
}

//Homepage
interface UserLocation {
  country_name: string;
  city?: string;
  [key: string]: any;
}

interface OtpSenderProps {
  phoneNumber: string;
  setPhoneNumber: (number: string) => void;
  onOtpSent: () => void;
}
interface EmailOtpVerifierProps {
  email: string;

  phoneNumber: string;
  onVerified: () => void;
  onChangeNumber: () => void;
  onChangeEmail: () => void;
}
interface EmailOtpSenderProps {
  email: string;
  onOtpSent: () => void;
}

interface SendOtpResponse {
  message: string;
  otp?: string; 
  
}
interface VerifyOtpResponse {
  message: string;
  // add other fields your API returns if needed
}
interface ResendOtpResponse {
  otp: string;
  message: string;
  // add other fields your API returns if needed
}


interface ProfileImageUploadProps {
  setValue?: (field: string, value: any) => void;
  trigger?: (field: string) => void;
}

interface CourseRatingProps {
  courseId: string;
  userRating?: number;
}
interface CreateCouponResponse {
  code: string;
  discount: number | string;
  expiresAt: string;
  usageLimit: number | string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;

}

interface Coupon {
  _id: string;
  code: string;
  discount: number | string;
  expiresAt: string | Date  | number;
  usageLimit: number | string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}


interface UpdateCouponResponse {
  updatedCoupon: Coupon;
}
interface DeleteCouponResponse {
  message: string;
}
interface fetchCouponsProps {
  coupons: Coupon[];
}

interface fetchCouponsResponse {
 coupons: Coupon[];
  total: number;
}

interface AuthStore {
  authUser: AuthUser | null;
  userLoggedInitialized: boolean;
  hasInitialized: boolean;
  isAuthLoading: boolean;
  
  setAuthUser: (authUser: AuthUser | null) => void;
  clearAuthUser: () => void;
  setAuthLoading: (loading: boolean) => void;
  setHasInitialized: (value: boolean) => void;
  setUserLoggedInitialized: (value: boolean) => void;
  fetchUser: () => Promise<void>;
}
export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name?: string;
  image?: string;
}
interface CartStore {
  cart: Record<string, CartItem>; // key can be productId
  fetchCart: () => Promise<Record<string, CartItem> | void>;
}
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatStore {
  chat: ChatMessage[];
  setChat: (chat: ChatMessage[]) => void;
  addMessage?: (message: ChatMessage) => void;
  clearChat?: () => void;
}
interface CourseStore {
  courses: Course[];
  fetchCourses: () => Promise<Course[]>;
  setCourses?: (courses: Course[]) => void ; 

}
declare global {
  var otpStore: Record<string, string>;
}
