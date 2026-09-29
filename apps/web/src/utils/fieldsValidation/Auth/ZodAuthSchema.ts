import { validateEmail } from "@/utils/phoneValidators";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email").refine(validateEmail),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signUpBase = z.object({
  name: z.string().min(1),
  email: z.string().email("Invalid email").refine(validateEmail),
  username: z.string().min(5, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  profileImage: z.string(),
});

export const signUpSchema = signUpBase.refine(
  (d) => d.password === d.confirmPassword,
  { path: ["confirmPassword"], message: "Passwords do not match" }
);