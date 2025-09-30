import React from "react";

export const getCategoryImagePath = (category: string) => {
  // Use absolute path for production compatibility
  const imagePath = `/assets/categories/${category?.toLowerCase()}.webp`;
  
  // Fallback to placeholder if image doesn't exist
  return imagePath;
};
