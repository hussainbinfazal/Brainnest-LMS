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


//Init Route rate limit config
export const UPLOAD_INIT_IP_KEY = {
  namespace: 'upload-init:ip',
  id: 'ip',
  max: 30,          // generous ceiling for legitimate service-to-service traffic
  windowSec: 60,
  description: 'Backstop against anonymous spam of upload session creation from one IP',
  usedIn: ['Upload Init Rate Limiting'],
} as const;

///Geneate Signature route rate limit config
export const UPLOAD_SIGN_IP_KEY = {
  namespace: 'upload-sign:ip',
  id: 'ip',
  max: 30,          // generous ceiling for legitimate service-to-service traffic
  windowSec: 60,
  description: 'Backstop against anonymous spam of upload session creation from one IP',
  usedIn: ['Upload Init Rate Limiting'],
} as const;

//Generate Signature route rate limit config
export const UPLOAD_SIGN_USER_KEY = {
  namespace: 'upload-sign:user',
  max: 15,
  windowSec: 60,
  description: 'Limits Cloudinary signature requests per authenticated user',
  usedIn: ['Upload Signature Rate Limiting'],
} as const;

