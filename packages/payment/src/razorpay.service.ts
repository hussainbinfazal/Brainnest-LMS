import Razorpay from "razorpay";
import { RazorpayOrderParams } from "./payment.types";

export class RazorpayService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  async createOrder({
    amount,
    receipt,
    currency = "INR",
  }: RazorpayOrderParams) {
    return this.razorpay.orders.create({
      amount: amount * 100,
      currency,
      receipt,
    });
  }
  async fetchPayment(paymentId: string) {
    return this.razorpay.payments.fetch(paymentId);
  }
}