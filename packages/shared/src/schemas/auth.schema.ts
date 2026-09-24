import { validateEmail } from "src/validators"
import { z } from "zod";
export const verifyEmailBodySchema = z.object({
    email: z.string().email().max(254).refine(validateEmail),
    otp: z.string().regex(/^\d{6}$/),
})
export type VerifyEmailBody = z.infer<typeof verifyEmailBodySchema>


export const sendEmailBodySchema = z.object({
    email: z.string().trim().toLowerCase().email().max(254).refine(validateEmail),
});
export type SendEmailBody = z.infer<typeof sendEmailBodySchema>