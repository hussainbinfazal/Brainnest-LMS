"use server"
import { CCategoryWithChildren, getCategoriesWithCache } from "../getCachedCategory";
import { getCachedFacets } from "../getCachedFacets";
import { logger } from "@repo/shared";
import { CFacets } from "@/types/client";
import { serializeDocument } from "@/utils/serializer/serializeDocument";



export async function getSidebarFacets(): Promise<{ facetsCategories: CCategoryWithChildren[], facetsLanguages: string[], facetsLevel: string[] }> {
    try {
        const facets: CFacets = await getCachedFacets()
        if (facets.categories.length === 0) {
            logger.error("No categories found in facets", { facets });
        };
        const categoriesWithChildren: CCategoryWithChildren[] = await getCategoriesWithCache();
        if (categoriesWithChildren.length === 0) {
            logger.error("No categories found in categoriesWithChildren", { categoriesWithChildren });
        }
        const usedCategoryIds: Set<string> = new Set(facets.categories.map(c => c._id.toString())); // Set of used category IDs means we only show categories that are used that have courses available

        const visibleTree: CCategoryWithChildren[] = categoriesWithChildren
            .map((cat: CCategoryWithChildren) => ({
                ...cat,
                children: cat.children.filter(child => usedCategoryIds.has(child._id.toString())),
            }))
            .filter(cat => cat.children.length > 0 || usedCategoryIds.has(cat._id.toString()));
        const visibleLanguages: string[] = facets.languages.map(l => l._id).filter(Boolean);
        const visibleLevel: string[] = facets.levels.map(l => l._id).filter(Boolean);
        const serializedCategory: CCategoryWithChildren[] = serializeDocument(visibleTree);
        const serializedLanguages = serializeDocument(visibleLanguages);
        const serializedLevel: string[] = serializeDocument(visibleLevel);
        logger.info("Sidebar facets fetched successfully");
        return { facetsCategories: serializedCategory, facetsLanguages: serializedLanguages, facetsLevel: serializedLevel };

    } catch (error: unknown) {
        logger.error("Error fetching sidebar facets", { error });
        return { facetsCategories: [], facetsLanguages: [], facetsLevel: [] };
    }
}