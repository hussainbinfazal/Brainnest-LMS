import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import User, { IUser } from "./models/userModel";
import { AuthUser } from "./types/client";
import { authenticateUser } from "./utils/checkAuthenticationStatus";
import { connectDB } from "./config/db";

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
          role: user.role,
          phoneNumber: user.phoneNumber || "",
          profileImage: user.profileImage || ""
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/login",
    signOut: "/",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "github" || account?.provider === "google") {
        try {
          await connectDB();
          let existingUser = await User.findOne({ email: user.email });
          
          if (!existingUser) {
            const newUser = new User({
              email: user.email,
              name: user.name,
              role: "user",
              profile: user.image || "",
              phoneNumber: user.phoneNumber || "",
              
            });
            existingUser = await newUser.save();
          }
          
          // Add user data to the user object for JWT
          user.id = existingUser._id.toString() as string;
          user.role = existingUser.role;
          user.phoneNumber = existingUser.phoneNumber;
          user.profileImage = existingUser.profileImage;
          user.name = existingUser.name;
          user.email = existingUser.email;
          

          
          return true;
        } catch (error) {
          // console.error("OAuth sign in error:", error);
          return true; // Allow sign in even if DB fails
        }
      }
      return true;
    },
    
    async jwt({ token, user }) {
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
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.name = token.name as string;
      session.user.email = token.email as string;
      session.user.phoneNumber = token.phoneNumber as string;
      session.user.role = token.role as string;
      session.user.profileImage = token.profileImage as string;
      

      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
