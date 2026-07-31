import { IReview, Review, connectDB, logger } from "@repo/shared";
import { getCached, setCached, CACHE_TTL } from "@repo/shared/config/redisConfig/cache-helper";
import { CReview } from "@/types/client";
import { serializeReviews } from "@/utils/serializer/review.Serializer";

/**
 * Single source of truth for fetching "clean" reviews with Redis caching.
 * Used anywhere reviews are needed server-side, so cache shape and query
 * logic never drift apart across call sites.
 */
export async function getReviewsWithCache(): Promise<CReview[]> {
  const cached = await getCached<CReview[]>("reviews:courses", "all");
  if (cached) {
    logger.info("Reviews fetched from cache", { reviewCount: cached.length });
    return cached;
  }

  await connectDB(process.env.MONGODB_URI!);

  try {
    const rawReviews : IReview[] = await Review.find({ status: "clean" })
      .populate("user", "name profileImage")
      .limit(50)
      .lean()
      .exec();

    const serialized = serializeReviews(rawReviews);
    await setCached("reviews:courses", "all", serialized, CACHE_TTL.MEDIUM);

    logger.info("Reviews fetched successfully", { reviewCount: serialized.length });
    return serialized;
  } catch (err: unknown) {
    logger.error("Error fetching reviews", { err });
    return [];
  }
}