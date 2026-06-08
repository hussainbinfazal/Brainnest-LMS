import { verifyRazorpaySignature } from "./verifySignature";

export class PaymentService {
  verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ) {
    return verifyRazorpaySignature(
      orderId,
      paymentId,
      signature
    );
  }

  generateReceipt() {
    return `rcpt_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;
  }
}