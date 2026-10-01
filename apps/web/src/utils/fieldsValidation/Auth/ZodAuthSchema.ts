import { validateEmail } from "@/utils/phoneValidators";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email").refine(validateEmail),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signUpBase = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Invalid email").refine(validateEmail, "Email not allowed"),
  username: z.string().min(5, "Username must be at least 5 characters").max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  profileImage: z.string().url().startsWith("http").optional(),
});

export const signUpSchema = signUpBase.refine(
  (d) => d.password === d.confirmPassword,
  { path: ["confirmPassword"], message: "Passwords do not match" }
);