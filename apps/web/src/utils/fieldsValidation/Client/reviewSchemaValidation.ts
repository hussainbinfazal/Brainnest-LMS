import {z } from "zod";


export const zodReviewSchema = z.object({
    rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
    comment:z.string().min(10, "Comment must be at least 10 characters and at most 50 characters").max(50, "Comment must be at most 50 characters"),
})

export type CCreateReview = z.infer<typeof zodReviewSchema>;