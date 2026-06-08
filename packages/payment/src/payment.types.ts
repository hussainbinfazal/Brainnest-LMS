export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface RazorpayOrderParams {
  amount: number;
  receipt: string;
  currency?: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  message: string;
}