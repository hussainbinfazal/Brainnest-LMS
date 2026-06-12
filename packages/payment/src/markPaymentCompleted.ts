import { ClientSession } from "mongoose";
import {PaymentsDocument } from "@repo/shared";


export async function markPaymentCompleted({
  payment,
  paymentId,
  session
}: {
  payment: PaymentsDocument;
  paymentId: string;
  session: ClientSession;

}) {
  payment.paymentStatus = "Completed";
  payment.paymentId = paymentId;
  payment.paymentAt = new Date();

  await payment.save({ session });

  return payment;
}