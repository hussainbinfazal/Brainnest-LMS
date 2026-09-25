import { validateEmail } from "@/utils/phoneValidators";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signUpSchema = z.object({
  name: z.string(),
  email: z.string().email("Invalid email").refine(validateEmail),
  username:z.string().min(5, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["USER", "INSTRUCTOR", "ADMIN"]),
  profileImage: z.string(),
  phoneNumber: z.coerce.number({
    required_error: "Phone number is required",
    invalid_type_error: "Phone number must be a number",
  }),
});