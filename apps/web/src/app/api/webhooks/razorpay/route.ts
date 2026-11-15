// app/api/webhook/razorpay/route.ts
import { logger } from "@repo/shared/server";
import { connectDB, Payment } from "@repo/shared/server";
import {
  handleRazorypayWebhook,
  verifyWebhookSignature,
} from "@repo/payment";
import { CustomNextRequest } from "@/types/server";
import { NextResponse } from "next/server";
import {
  failResponse,
  successResponse,
} from "@/lib/helpers/failResponseHelper";
import { auth } from "@/auth";

type RazorpayWebhookEvent = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        order_id?: string;
      };
    };
  };
};

export async function POST(
  request: CustomNextRequest
): Promise<NextResponse> {
  logger.info("Razorpay webhook received");
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  console.log("This is the signature on api/webhooks route", signature);
  // if (!signature || !verifyWebhookSignature(rawBody, signature)) {
  //   console.log("This is rawBody in POST Route", rawBody);
  //   console.log("This is the signature on api/webhooks route", signature);
  //   logger.warn("Rejected Razorpay webhook with invalid signature");
  //   return failResponse(
  //     { message: "Invalid webhook signature" },
  //     400,
  //     undefined,
  //     undefined,
  //     true
  //   );
  // }

  // let event: RazorpayWebhookEvent;
  // try {
  //   event = JSON.parse(rawBody) as RazorpayWebhookEvent;
  // } catch {
  //   console.log("This is rawBody in POST Route", rawBody);
  //   logger.warn("Rejected Razorpay webhook with invalid JSON");
  //   return failResponse(
  //     { message: "Invalid webhook body" },
  //     400,
  //     undefined,
  //     undefined,
  //     true
  //   );
  // }

  // await connectDB(process.env.MONGODB_URI);
  // const payment = await Payment.findOne({ razorpayOrderId })
  //   .select("paymentBy")
  //   .lean()
  //   .exec();
  // if (!payment?.paymentBy) {
  //   logger.error("No local payment found for Razorpay order", {
  //     razorpayOrderId,
  //   });
  //   return failResponse(
  //     {
  //       message: "No local payment found for Razorpay order",
  //       razorpayOrderId,
  //     },
  //     500,
  //     undefined,
  //     undefined,
  //     true
  //   );
  // }

  const result = await handleRazorypayWebhook(
    { rawBody, signature },
  );
  if (result.status >= 400) {
    return failResponse(
      { message: "Invalid webhook signature" },
      result.status,
      undefined,
      undefined,
      true
    );
  }
  return successResponse(
    { received: true },
    result.status,
    undefined,
    undefined,
    true
  );
}
