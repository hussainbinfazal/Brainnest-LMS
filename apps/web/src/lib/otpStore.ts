// lib/otpStore.ts

import { OtpEntry } from "@/types/server";

// Initialize if not already defined
if (!global.otpStore) {
  global.otpStore = {};
}

// Export the global instance
const otpStore: Record<string, OtpEntry> = global.otpStore;
export default otpStore;

// if (!global.otpStore) {
//     global.otpStore = {};
//   }
  
