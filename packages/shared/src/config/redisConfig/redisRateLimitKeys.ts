// export const OTP_SEND_IP = {
//   max: 5,
//   windowSec: 60,
// } as const;

export const OTP_SEND_EMAIL_IP_KEY = {
  namespace: "otp-send:ip",
  id: "ip",
  max: 5,
  windowSec: 60,
  description: "To Rate limit IPs in send email OTP route",
  usedIn: ["User Verification"],
};

export const OTP_VERIFY_EMAIL_IP_KEY = {
  namespace: "otp-verify-email:ip",
  id: "ip",
  max: 5,
  windowSec: 60,
  description: "To Rate limit IPs in verify email OTP route",
  usedIn: ["User Verification"],
}

