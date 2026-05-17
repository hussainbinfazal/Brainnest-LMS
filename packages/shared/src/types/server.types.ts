
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

interface OtpEntry {
  otp: string;
  expires: number;
}
declare global {
  var otpStore: Record<string, OtpEntry> | undefined;
}

