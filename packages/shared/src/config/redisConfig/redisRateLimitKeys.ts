// export const OTP_SEND_IP = {
//   max: 5,
//   windowSec: 60,
// } as const;

export const OTP_SEND_EMAIL_IP_KEY = {
  namespace: 'otp-send:ip',
  id: 'ip',
  max: 5,
  windowSec: 15 * 60,   // 900 — matches the cost of a real email send
  description: 'Rate limit IPs on the send-email-OTP route',
  usedIn: ['User Verification'],
} as const;

export const OTP_VERIFY_EMAIL_IP_KEY = {
  namespace: 'otp-verify-email:ip',
  id: 'ip',
  max: 30,
  windowSec: 15 * 60,   // consistent window with send, easier to reason about
  description: 'Rate limit IPs on the verify-email-OTP route',
  usedIn: ['User Verification'],
} as const;

export const INTERNAL_AUTH_IP_KEY = {
  namespace: 'internal-auth:ip',
  id: 'ip',
  max: 300,          // generous ceiling for legitimate service-to-service traffic
  windowSec: 60,
  description: 'Guards worker routes against secret brute-forcing from a given IP',
  usedIn: ['Authentication'],
} as const;
export const GLOBAL_IP_KEY = {
  namespace: 'global:ip',
  id: 'ip',
  max: 100,          // generous ceiling for legitimate service-to-service traffic
  windowSec: 60,
  description: 'Guard api routes against brute-forcing from a given IP',
  usedIn: ['Global Rate Limiting'],
} as const;

