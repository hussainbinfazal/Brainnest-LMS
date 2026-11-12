import crypto from 'crypto';

///Compare two hex strings without leaking timing information

function safeEqualHex(a: string, b: string): boolean {
  // To Decode the first hex string into raw bytes
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  //Constant time comparison
  return crypto.timingSafeEqual(bufA, bufB);
}

///Build an HMAC-SHA56 hex digest
function hmac(secret: string, payload: string): string {
  if (!secret) throw new Error('Missing Razorypay Secret');
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// Verifies the signature the browser receives after checkout (orderId|paymentId)
export function verifyCheckoutSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string = process.env.RAZORPAY_KEY_SECRET ?? '',
): boolean {
  return safeEqualHex(hmac(secret, `${orderId}|${paymentId}`), signature);
}

// Verifies a webhook: HMAC of the RAW request body with the webhook secret
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string = process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
): boolean {
  // Compare expected digest with the X-Razorpay-Signature header
  return safeEqualHex(hmac(secret, rawBody), signature);
}
