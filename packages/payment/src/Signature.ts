import { logger } from '@repo/shared/server';
import crypto from 'crypto';
// logger.info("razorpay env check in signature file", {
//   // JSON.stringify makes hidden whitespace visible, e.g. "RAZORPAY_WEBHOOK_SECRET "
//   names: JSON.stringify(Object.keys(process.env).filter((k) => k.toUpperCase().includes("RAZORPAY"))),
//   // 0 means the line exists but the value is empty; null means the variable is missing entirely
//   webhookSecretLength: process.env.RAZORPAY_WEBHOOK_SECRET?.length ?? null,
// });
///Compare two hex strings without leaking timing information

function safeEqualHex(a: string, b: string): boolean {
  // To Decode the first hex string into raw bytes
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  //Constant time comparison
  return crypto.timingSafeEqual(bufA, bufB);
}

///Build an HMAC-SHA256 hex digest
function hmac(secret: string, payload: string): string {
  if (!secret) throw new Error('Missing Razorpay Secret');
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// Verifies the signature the browser receives after checkout (orderId|paymentId)
export function verifyCheckoutSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string = process.env.RAZORPAY_KEY_SECRET!,
): boolean {
  return safeEqualHex(hmac(secret, `${orderId}|${paymentId}`), signature);
}

// Verifies a webhook: HMAC of the RAW request body with the webhook secret
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string = process.env.RAZORPAY_WEBHOOK_SECRET!,
): boolean {
  console.log('This is the secret in the verifyWebhookSignature', secret);
  if (!secret) throw new Error('Missing Razorpay Webhook Secret in verifyWebhook Signature');
  // Compare expected digest with the X-Razorpay-Signature header
  return safeEqualHex(hmac(secret, rawBody), signature);
}
