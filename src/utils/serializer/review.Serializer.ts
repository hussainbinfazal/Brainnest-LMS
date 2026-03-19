import { CReview } from "@/types/client";
import { IReview } from "@/types/model";
import { serializeDocument } from "./serializeDocument";


export function serializeReview(review: IReview): CReview {
    return serializeDocument(review) as unknown as CReview;
}
export function serializeReviews(reviews: IReview[]): CReview[] {
    return serializeDocument(reviews) as unknown as CReview[];
}