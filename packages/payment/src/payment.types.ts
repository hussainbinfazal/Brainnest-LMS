import { PaymentDocument } from "@repo/shared/types"
import { ClientSession } from "mongoose"
import { SettleSource } from "./payment.constant"

export interface HandlerContext {
  // Payment document, already marked Completed inside the transaction
  payment: PaymentDocument,
  // Every write inside a handler MUST pass this session
  session: ClientSession
}

// Domain logic for one kind of payment (Course, Chat, ...)
export interface PaymentHandler {
  // Grants whatever the user paid for; must throw if it cannot
  fulfill: (ctx: HandlerContext) => Promise<void>
  // Optional cleanup when a payment is given up on
  expire?: (ctx: HandlerContext) => Promise<void>
}

///Map of paymentOnModel -> handler; passed in, never global, so no module - duplication surprises
export type PaymentHandlers = Record<string, PaymentHandler>

export interface SettleInput {
  razorpayOrderId: string,
  amount: number,
  paymentBy: string,
  razorpayPaymentId: string,
  paymentMethod: string,
  error: {
    code: string,
    description: string,
    source: string,
    step: string,
    reason: string,
    metadata: Record<string, string>,

  }
  source: SettleSource
}
// What happened, so callers can respond properly
export type SettleOutcome = "settled" | "already_settled" | "not_found";