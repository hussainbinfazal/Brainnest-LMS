
// app/api/webhook/razorpay/route.ts
import { logger } from '@repo/shared/server';
import { handleRazorypayWebhook, verifyAndSettle } from '@repo/payment';
import { CustomNextRequest } from '@/types/server';
import { auth } from "@/auth";

export async function POST(request: CustomNextRequest) {
  const session = await auth();
  if (!session) {
    logger.error('Webhook request for unauthorized user');
    return
  };
  const userId = session.user.id;
  const body = await request.text(); // raw body for signature
  const signature = request.headers.get('x-razorpay-signature');
  return handleRazorypayWebhook({ rawBody: body, signature }, userId);
  // ✅ Verify it's actually from Razorpay
}