import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      phoneNumber?: string;
      role: string;
      name: string;
      email: string;
      profileImage?: string; 
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    phoneNumber: string;
    role: string;
    profileImage?: string;
    phoneNumber?: string;



     
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string;
    email: string;
    profileImage?: string;
    id: string;
    phoneNumber?: string;
    name: string;
  }
}