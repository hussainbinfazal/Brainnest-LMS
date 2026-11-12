import { logger } from '@repo/shared/server';
import Razorpay from 'razorpay';

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface RazorpayOrderParams {
  amountInPaise: number;
  receipt: string;
  currency?: string;
  notes?: Record<string, string>;
}

export interface VerifyPaymentResult {
  success: boolean;
  message: string;
}
export class RazorpayService {
  private client: Razorpay;

  constructor(
    keyId: string | undefined = process.env.RAZORPAY_KEY_ID,
    keySecret: string | undefined = process.env.RAZORPAY_KEY_SECRET,
  ) {
    if (!keyId || !keySecret) throw new Error('Razorpay keys are missing');
    this.client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  async createOrder({
    amountInPaise,
    receipt,
    currency,
    notes,
  }: RazorpayOrderParams) {
    if (!Number.isInteger(amountInPaise) || amountInPaise <= 0) {
      logger.error('Invalid amount requested');
      throw new Error('amountInPaise must be a positive integer');
    }
    return this.client.orders.create({
      amount: amountInPaise,
      currency: currency || 'INR',
      receipt,
      notes,
    });
  }
  async fetchPayment(paymentId: string) {
    if (!paymentId) throw new Error('paymentId is required');
    return this.client.payments.fetch(paymentId);
  }
  // To Fetch every attempt made against one Razorpay order (the sweep needs this)
  async fetchOrderPayments(razorpayOrderId: string) {
    return this.client.orders.fetchPayments(razorpayOrderId);
  }
}
let instance: RazorpayService | null = null;
export function getRazorpay(): RazorpayService {
  if (!instance) instance = new RazorpayService();
  return instance;
}
