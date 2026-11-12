export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
} as const;

export const PAYMENT_PROVIDER = {
  RAZORPAY: 'razorpay',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const PAYMENT_SOURCE = {
  WEB: 'Web',
  CHAT: 'Chat',
} as const;

export const RECONCILE_QUEUE = 'reconcileQueue';

export type SettleSource = 'verify' | 'webhook' | 'sweep';
