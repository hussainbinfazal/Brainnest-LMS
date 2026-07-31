'use client';

import { create } from "zustand";
import axios, { AxiosError } from "axios";
import { toast } from "sonner"
import { CCategory, CCourse, CCourseStore, CReview } from "@/types/client";
import { CCategoryWithChildren } from "../getCachedCategory";






export const useCourseStore = create<CCourseStore>((set) => ({
    courses: [] as CCourse[],
    reviews: [] as CReview[],
    categories: [] as CCategory[],
    fetchCourses: async ({ fetchedCourses, fetchedReviews, fetchedCategories }: { fetchedCourses?: CCourse[], fetchedReviews?: CReview[], fetchedCategories?: CCategoryWithChildren[] }): Promise<CCourse[]> => {
        if (fetchedCourses) {
            set({
                courses: fetchedCourses,
                ...(fetchedReviews && { reviews: fetchedReviews }),
                ...(fetchedCategories && { categories: fetchedCategories }),
            })
            // console.log("There are the courses in the store", fetchedCourses)
            // console.log("There are the categories in the store", fetchedCategories)
            return fetchedCourses
        }
        try {
            const response = await axios.get("/api/course")
            set({ courses: response.data });

            // console.log("Response", response.data);
            return response.data

        } catch (err: unknown) {
            let message = "Something went wrong";

            if (axios.isAxiosError(err)) {
                message = err.response?.data?.message || err.message || message;
            } else if (err instanceof Error) {
                message = err.message;
            }
            toast.error(message);
            return [];
        }
    },

}));