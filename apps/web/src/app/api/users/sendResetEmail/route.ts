import { sendEmail } from "@/lib/helpers/mailer";
import { logger } from "@repo/shared";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, userId, emailType,token } = await request.json();

    const emailResponse = await sendEmail(email, emailType, userId, token);
    logger.info("Email sent successfully");
    return NextResponse.json({ success: true, message: "Email sent", emailResponse }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error("Email error:", {message});
    return NextResponse.json({ success: false, message: `Error in sending email: ${message}` }, { status: 500 });
  }
}