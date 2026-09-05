import { NextRequest } from "next/server";
import { IOrder } from "./model";

export interface ISessionUser {
  id: string;
  phoneNumber?: string;
  role: 'instructor' | 'student' | 'admin';
  name: string;
  email: string;
  profileImage?: string;

}
export interface RazorpayCreateOrderRequest {
  amount: number;        // amount in paisa
  currency: string;      // usually 'INR'
  receipt: string;       // unique identifier
  notes?: Record<string, any>; // optional notes
};

export interface MyRazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id: string | null;
  status: "created" | "paid" | "attempted";
  attempts: number;
  created_at: number;
}
export interface IGetCourseByParamsResponse {
  paginatedCourses: CCourse[];
  currentPage: number;
  hasNextPage: boolean,
  hasPrevPage: boolean,
  totalPages: number;
  totalCourses: number;
};

export type IFacets = {
  categories: {
    _id: string;
    count: number;
    category: ICategory[];
  }[];
  languages: {
    _id: string;
  }[];
  levels: {
    _id: string;
  }[];
};


export interface OtpEntry {
  otp: string;
  expires: number;
}
declare global {
  var otpStore: Record<string, OtpEntry> | undefined;
}

export interface CustomNextRequest extends NextRequest {
  ip: string;
}