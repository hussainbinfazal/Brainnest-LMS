export const OTP_SEND_IP = {
    max: 5,
    windowSec: 60,
} as const;

export const OTP_SEND_IP_KEY = {
  namespace: "otp-send:ip",
  id: "ip",
  max: OTP_SEND_IP.max,
  windowSec: OTP_SEND_IP.windowSec,
  description: "To Rate limit IPs in send email OTP route",
  usedIn: ["User Verification"],
};

