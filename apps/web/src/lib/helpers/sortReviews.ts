
import { CReview } from "@/types/client";



export type ReviewSortOption = "helpful" | "positive" | "negative" | "newest" | "oldest";

export function sortedReviews(reviews: CReview[], sortBy: ReviewSortOption): CReview[] {
    const clean = reviews.filter(review => review.status === "clean");
    switch (sortBy) {
        case "helpful":
            return [...clean].sort((a, b) => b.score - a.score);
        case "positive":
            return [...clean].sort((a, b) => b.rating - a.rating);
        case "negative":
            return [...clean].sort((a, b) => a.rating - b.rating);
        case "newest":
            return [...clean].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        case "oldest":
            return [...clean].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        default:
            return clean;
    }
}