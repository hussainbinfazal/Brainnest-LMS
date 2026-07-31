import { CCourse } from "@/types/client";
import { CCategoryWithChildren } from "../getCachedCategory";


  export function getPopularCategories(categories: CCategoryWithChildren[]): CCategoryWithChildren[] {
    const sortedCategories = categories.sort((a, b) => b.children.length - a.children.length);
    return sortedCategories.slice(0, 3);
  }
  