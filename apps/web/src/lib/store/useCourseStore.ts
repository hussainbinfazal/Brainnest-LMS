'use client';

import { create } from "zustand";
import axios, { AxiosError } from "axios";
import { toast } from "sonner"
import { CCategory, CCourse, CCourseStore, CReview } from "@/types/client";
import { CCategoryWithChildren } from "../getCachedCategory";






export const useCourseStore = create<CCourseStore>((set, get) => ({
    courses: [] as CCourse[],
    reviews: [] as CReview[],
    categories: [] as CCategoryWithChildren[],
    isLoading: false,
    hasFetched: false,
    fetchCourses: async ({ fetchedCourses, fetchedReviews, fetchedCategories, force = false } = {}): Promise<CCourse[]> => {
        if (fetchedCourses) {
            set({
                courses: fetchedCourses,
                ...(fetchedReviews && { reviews: fetchedReviews }),
                ...(fetchedCategories && { categories: fetchedCategories }),

                ...(fetchedCategories && { categories: fetchedCategories }),
                hasFetched: true
            });
            // console.log("There are the courses in the store", fetchedCourses)
            // console.log("There are the categories in the store", fetchedCategories)
            return fetchedCourses
        }
        const { courses, hasFetched, isLoading } = get();
        if (hasFetched && !force) return courses
        if (isLoading) { return courses }
        set({ isLoading: true })
        try {
            const response = await axios.get("/api/course");
            const data = response.data;
            const fetchedCourses = data.courses ?? data;
            const fetchedReviews = data.reviews ?? [];
            const fetchedCategories = data.categories ?? [];
            set({ courses: fetchedCourses, reviews: fetchedReviews, categories: fetchedCategories, hasFetched: true, isLoading: false });

            // console.log("Response", response.data);
            return fetchedCourses;

        } catch (err: unknown) {
            let message = "Something went wrong";

            if (axios.isAxiosError(err)) {
                message =
                    err.response?.data?.message ||
                    err.message ||
                    message;

            } else if (err instanceof Error) {
                message = err.message;
            }

            toast.error(message);

            set({
                isLoading: false,
            });

            return [];
        }
    },
    setCourses: (courses) =>
        set({
            courses,
            hasFetched: true,
        }),

    clearCourses: () =>
        set({
            courses: [],
            reviews: [],
            categories: [],
            hasFetched: false,
        }),

}));