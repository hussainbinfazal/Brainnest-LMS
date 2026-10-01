import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { sendEmail } from "@/lib/helpers/mailer";
import { logger } from '@repo/shared/server';
import { NextRequest, NextResponse } from "next/server";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";

const sendResetEmailBodySchema = z.object({
  email: z.string().email(),
  userId: z.string(),
  emailType: z.string(),
  token: z.string(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await parseBody(request, sendResetEmailBodySchema);
    if (!body.ok) return body.response;
    const { email, userId, emailType, token } = body.data;

    const emailResponse = await sendEmail(email, emailType, userId, token);
    logger.info("Email sent successfully");
    return successResponse({ success: true, message: "Email sent", emailResponse }, 200, undefined, undefined, true);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error("Email error:", {message});
    return failResponse({ success: false, message: `Error in sending email: ${message}` }, 500, undefined, undefined, true);
  }
}