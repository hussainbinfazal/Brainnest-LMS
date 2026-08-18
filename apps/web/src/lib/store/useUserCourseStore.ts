"use client";

import { create } from "zustand";
import axios from "axios";
import { toast } from "sonner";
import { CCourse, CUserCourse } from "@/types/client";
import { clientLogger } from "@/utils/logger/clientLogger";

interface CUserCourseStore {
    userCourseByCourseId: Record<string, CUserCourse>;
    isLoading: boolean;
    fetchUserCourseById: (courseId: string,) => Promise<void>;
    setUserCourseById: (
        courseId: string,
        userCourse: CUserCourse
    ) => void;
    getUserCourseById: (courseId: string) => CUserCourse | null;
    setLiked: (courseId: string, updates: Partial<CUserCourse>) => void;
    clearUserCourseById: () => void;
}

export const useUserCourseStore = create<CUserCourseStore>((set, get) => ({
    userCourseByCourseId: {},
    isLoading: false,

    fetchUserCourseById: async (courseId: string,) => {
        try {

            const response = await axios.get(`/api/userCourse/${courseId}`);

            set({ userCourseByCourseId: response.data.userCourse });
        } catch (error: unknown) {
            clientLogger.error("Error fetching user course", error);
            // toast.error("Something went wrong!");
        }
    },
    setUserCourseById: (courseId, userCourse: CUserCourse) =>
        set((state) => ({
            userCourseByCourseId: {
                ...state.userCourseByCourseId,
                [courseId]: userCourse,
            },
        })),
    getUserCourseById: (courseId) => get().userCourseByCourseId[courseId] ?? null,
    setLiked: (courseId: string, updates) => {
        set((state) => {
            const current = state.userCourseByCourseId[courseId];
            if (!current) return state;
            return {
                userCourseByCourseId: {
                    ...state.userCourseByCourseId,
                    [courseId]: {
                        ...current,
                        ...updates

                    },
                },
            };
        })
    },
    clearUserCourseById: () =>
        set({
            userCourseByCourseId: {}
        })
}))