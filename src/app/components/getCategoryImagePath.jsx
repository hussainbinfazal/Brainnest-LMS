import React from "react";

export const getCategoryImagePath = (category) => {
  return `/assets/categories/${category?.toLowerCase()}.webp`;
};
