import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { authenticateUser } from "./utils/checkAuthenticationStatus";
import { connectDB } from "./config/mongoDB/db";
import { JWT } from "next-auth/jwt";
// import type { User as NextAuthUser, Account, Profile, Session } from "@auth/core/types";
import type { User as NextAuthUser, Account, Profile } from "next-auth";
import {User} from "@repo/shared";
import { IUser } from "./types/model";

type DBUser = IUser;
type AuthUser = NextAuthUser;
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,

    }),

    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        const user = await authenticateUser({
          email: credentials.email as string,
          password: credentials.password as string
        });

        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        } as any;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/login",
    signOut: "/",
  },
  callbacks: {
    async signIn({ user, account }: { user: NextAuthUser; account?: Account | null; profile?: Profile | null; }): Promise<boolean> {
      if (account?.provider === "github" || account?.provider === "google") {
        try {
          await connectDB();
          let existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            const newUser = new User({
              email: user.email,
              name: user.name,
              role: "student",
              profile: user.profileImage || "",
              phoneNumber: user.phoneNumber || "",

            });
            existingUser = await newUser.save();
          }

          // Add user data to the user object for JWT
          user.id = existingUser?._id?.toString() as string;
          user.role = existingUser.role;
          user.phoneNumber = existingUser.phoneNumber;
          user.profileImage = existingUser.profileImage;
          user.name = existingUser.name;
          user.email = existingUser.email;



          return true;
        } catch (error: any) {
          // console.error("OAuth sign in error:", error);
          return true; // Allow sign in even if DB fails
        }
      }
      return true;
    },

    async jwt({ token, user }: { token: any; user?: NextAuthUser }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.phoneNumber = user.phoneNumber;
        token.role = user.role;
        token.profileImage = user.profileImage;

      }
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
      session.user.id = token.id as string;
      session.user.name = token.name as string;
      session.user.email = token.email as string;
      session.user.phoneNumber = token.phoneNumber as string;
      session.user.role = token.role as string;
      session.user.profileImage = token.profileImage as string;
      session.user.cartId = token.cartId as string;


      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
