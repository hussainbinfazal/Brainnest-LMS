import { UserRole } from '@repo/shared/server';

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
  profileImage?: string;
}