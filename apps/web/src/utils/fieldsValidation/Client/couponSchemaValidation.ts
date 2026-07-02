import { z } from "zod";

export const zodCouponSchema = z.object({
    code: z.string().min(3, "Coupon code must be at least 3 characters"),

    discountValue: z.number().positive(),
    discountType: z.enum(["percentage", "fixed"]),
    maxUses: z.number().int().positive(),
    expiresAt: z.string().min(1),


});

export type CreateCoupon = z.infer<typeof zodCouponSchema>;