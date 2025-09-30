'use client';

import { create } from "zustand";
import axios, { AxiosError } from "axios";
import { toast } from "sonner"
import { Course, CourseStore } from "@/types/client";





export const useCourseStore = create<CourseStore>((set) => ({
    courses: [],
    fetchCourses: async () : Promise<Course[]> => {
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