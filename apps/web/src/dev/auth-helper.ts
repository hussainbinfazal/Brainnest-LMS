// lib/auth-helper.ts
import { auth } from "@/auth" // wherever your next-auth config exports auth()
import { User } from "@repo/shared";
import type { Session } from "next-auth";

export type DevUserRole = "student" | "instructor" | "admin";
export interface DevUser {
  id: string;
  name: string;
  email: string;
  role: DevUserRole;
  phoneNumber?: string;
  profileImage?: string
}
// const DEV_USER: Session = {
//   user: {
//     id: "dev_user_123",
//     email: "dev@brainnest.local",
//     name: "Dev Student",
//     role: "student",
//     phoneNumber: "9898989898",
//     profileImage: "https://i.pravatar.cc/150?u=dev_user_123",

//   },
//   expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
// };

export const DEV_USERS: Record<DevUserRole, DevUser> = {
  student: {
    id: "dev-student-001",
    name: "Dev Student",
    email: "dev.student@brainnest.local",
    role: "student",
    phoneNumber: "9898989898",
    profileImage: "https://i.pravatar.cc/150?u=dev_user_123"
  },

  instructor: {
    id: "dev-instructor-001",
    name: "Dev Instructor",
    email: "dev.instructor@brainnest.local",
    role: "instructor",
    phoneNumber: "9898989898",
    profileImage: "https://i.pravatar.cc/150?u=dev_user_123"
  },

  admin: {
    id: "dev-admin-001",
    name: "Dev Admin",
    email: "dev.admin@brainnest.local",
    role: "admin",
    phoneNumber: "9898989898",
    profileImage: "https://i.pravatar.cc/150?u=dev_user_123"
  },
};

export async function getDevUser(role: DevUserRole) {
  const email = {
    student: "dev.student@brainnest.local",
    instructor: "dev.instructor@brainnest.local",
    admin: "dev.admin@brainnest.local",
  }[role];

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error(
      `Development user not found: ${email}. Run the dev seed first.`
    );
  }

  return user;
}
export async function getSession(): Promise<Session | null> {
  if (process.env.BYPASS_AUTH === "true") {
    const role =
      (process.env.DEV_USER_ROLE as DevUserRole) ||
      "student";

    const user = await getDevUser(role);
    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        profileImage: user.profileImage,
      },
      expires: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    };
  }

  return auth();

}