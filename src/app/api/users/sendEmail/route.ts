import { sendEmail } from "@/lib/helpers/mailer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, userId, emailType } = await request.json();

    const emailResponse = await sendEmail(email, emailType, userId);
    return NextResponse.json({ success: true, message: "Email sent", emailResponse }, { status: 200 });
  } catch (error: any) {
    console.error("Email error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: `Error in sending email: ${message}` }, { status: 500 });
  }
}