import { IFacets } from "@/types/server";
import { CCategoryWithChildren } from "../getCachedCategory";

export async function getSidebarFacets(facets: IFacets, categoriesWithChildren: CCategoryWithChildren[]) {
    const usedCategoryIds: Set<string> = new Set(facets.categories.map(c => c._id.toString())); // Set of used category IDs means we only show categories that are used that have courses available
    const visibleTree = categoriesWithChildren
        .map((cat: CCategoryWithChildren) => ({
            ...cat,
            children: cat.children.filter(child => usedCategoryIds.has(child._id.toString())),
        }))
        .filter(cat => cat.children.length > 0 || usedCategoryIds.has(cat._id.toString()));
}