// lib/auth-helper.ts
import { auth } from "@/auth" // wherever your next-auth config exports auth()
import type { Session } from "next-auth";

const DEV_USER: Session = {
  user: {
    id: "dev_user_123",
    email: "dev@brainnest.local",
    name: "Dev User",
    role: "instructor",
    phoneNumber: "9898989898",
    profileImage: "https://i.pravatar.cc/150?u=dev_user_123",
  
  },
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};

export async function getSession(): Promise<Session | null> {
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    return DEV_USER;
  }
  return auth();
}