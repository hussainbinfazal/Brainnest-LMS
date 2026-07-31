import { CCategory, CReview } from "@/types/client";
import { IReview } from "@repo/shared";
import { serializeDocument } from "./serializeDocument";
import { ICategory } from "@repo/shared";


export function serializeReview(review: IReview): CReview {
    return serializeDocument(review) as unknown as CReview;
}
export function serializeReviews(reviews: IReview[]): CReview[] {
    return serializeDocument(reviews) as unknown as CReview[];
}
export function serializeCategories(category: ICategory[]): CCategory[] {
    return serializeDocument(category) as unknown as CCategory[];
}