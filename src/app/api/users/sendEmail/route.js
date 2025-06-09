import { sendEmail } from "@/lib/helpers/mailer";

export async function POST(req) {
  try {
    const { email, userId, emailType } = await req.json();

    const response = await sendEmail(email, emailType, userId);
    return Response.json({ success: true, message: "Email sent", response });
  } catch (error) {
    console.error("Email error:", error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}