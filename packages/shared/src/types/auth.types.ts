import type { UserRole } from "./model.types";

interface Credentials {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  profile?: string;
  profileImage?: string;
}