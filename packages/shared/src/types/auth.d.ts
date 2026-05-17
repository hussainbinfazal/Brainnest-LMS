interface Credentials {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: string;
  profile?: string;
  profileImage?: string;
}