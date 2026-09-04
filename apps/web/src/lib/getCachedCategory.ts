import { Category, connectDB, ICategory, logger } from "@repo/shared";
import { getCached, setCached, CACHE_TTL } from "@repo/shared/config/redisConfig/cache-helper";
import { CCategory } from "@/types/client";
import { serializeCategories } from "@/utils/serializer/review.Serializer";

/**
 * Single source of truth for fetching all categories (flat, not tree-shaped)
 * with Redis caching. Used anywhere categories are needed server-side.
 *
 * Returns a FLAT list — use `buildCategoryTree()` separately to nest
 * children under parents for display. Tree-shaping isn't cached here since
 * it's a cheap, presentation-only transform and keeping it out of the cache
 * key means the cached data stays reusable for any consumer, not just one
 * specific tree shape.
 */
export async function getCategoriesWithCache(): Promise<CCategoryWithChildren[]> {
  const cached = await getCached<CCategoryWithChildren[]>("Category", "all");
  if (cached) {
    logger.info("Categories fetched from cache", { categoryCount: cached.length });
    return cached;
  }

  await connectDB(process.env.MONGODB_URI!);

  try {
    const totalCategories: ICategory[] = await Category.find()
      .populate("parent", "_id name")
      .lean()
      .exec();

    const serialized : CCategory[] = serializeCategories(totalCategories);
    const mapped : CCategoryWithChildren[] = buildCategoryTree(serialized);
    await setCached("Category", "all", mapped, CACHE_TTL.VERY_LONG);
    logger.info("Categories fetched successfully", { categoryCount: serialized.length });
    return mapped;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error in fetching categories";
    logger.error("Error fetching Categories", { message, error });
    return [];
  }
}


export interface CCategoryWithChildren extends CCategory {
  children: CCategory[];
}

/**
 * Takes a flat list of categories (each optionally referencing a populated
 * `parent` object) and groups them into a two-level tree: top-level
 * categories with their direct children attached.
 *
 * NOTE: assumes `category.parent`, when present, is a populated object
 * with an `_id` field (from `.populate("parent", "_id name")` server-side),
 * not a bare ID string. If `CCategory.parent` is typed as `string | null`
 * elsewhere in the codebase, change the comparison below to
 * `child.parent === p._id` instead.
 */


export function buildCategoryTree(categories: CCategory[]): CCategoryWithChildren[] {
  if (!categories || categories.length === 0) {
    logger.warn("Categories array is empty or undefined. Cannot build category tree.", { totalCategories: categories?.length ?? 0 });
    throw new Error("Categories array is empty or undefined. Cannot build category tree.");
  }
  const parents: CCategory[] = categories.filter((c) => !c.parent);


  return parents.map((p: CCategory) => ({
    ...p,
    children: categories.filter((child: CCategory) => child.parent?._id?.toString() === p._id?.toString()),
  }));
}


//For particular course category tree, we can use this function to build the tree for a specific category and its children. This is useful when we want to display the category hierarchy for a specific course.
export function buildCourseCategoryTree(categories: CCategory[], categoryId: string): CCategoryWithChildren | null {
  if (!categoryId) {
    logger.warn("Category ID is required to build course category tree.", { categoryId });
    throw new Error("Category ID is required to build course category tree.");
  };
  const parent = categories.find((c) => c._id === categoryId);
  if (!parent) return null;

  return {
    ...parent,
    children: categories.filter((c) => c.parent?._id?.toString() === parent._id)
  };
}