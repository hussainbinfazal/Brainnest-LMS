"use client";

import { create } from "zustand";
import axios from "axios";
import { CCourse, CUserCourse } from "@/types/client";
import { clientLogger } from "@/utils/logger/clientLogger";

type CUserCourseStore = {
    userCourseByCourseId: Record<string, CUserCourse>;
    isLoading: boolean;
    fetchUserCourseById: (courseId: string,) => Promise<void>;
    setUserCourseById: (
        courseId: string,
        userCourse: CUserCourse
    ) => void;
    getUserCourseById: (courseId: string) => CUserCourse | null;
    updateUserCourse: (courseId: string, updates: Partial<CUserCourse>) => void;
    fetchUserCoursesByIds: (courseIds: string[]) => Promise<void>;
    isUpdatingLikeByCourseId: Record<string, boolean>;
    setUpdatingLike: (courseId: string, state: boolean) => void;
    clearUserCourseById: () => void;
}

export const useUserCourseStore = create<CUserCourseStore>((set, get) => ({
    userCourseByCourseId: {},
    isUpdatingLikeByCourseId: {},
    isLoading: false,

    fetchUserCourseById: async (courseId: string) => {
        try {

            const response = await axios.get(`/api/userCourse/${courseId}`);

            const userCourse = response.data.userCourse as CUserCourse;
            set((state) => ({
                userCourseByCourseId: {
                    ...state.userCourseByCourseId,
                    [courseId]: userCourse,
                },
            }));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Error in user Course Store"
            clientLogger.error("Error fetching user course", { message, error });
            // toast.error("Something went wrong!");
        }
    },
    fetchUserCoursesByIds: async (courseIds: string[]) => {
        if (courseIds.length === 0) return;
        try {
            const response = await axios.post("/api/userCourses/batch", { courseIds });
            const userCourses = response.data.userCourses as CUserCourse[];
            set((state) => {
                const updated = { ...state.userCourseByCourseId };
                userCourses.forEach((userCourse) => {
                    updated[userCourse.courseId] = userCourse;
                });
                return {
                    userCourseByCourseId: updated,
                };
            });
        } catch (error: unknown) {
            const message: string = error instanceof Error ? error.message : "Error in user Course Store"
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
    updateUserCourse: (courseId: string, updates) => {
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
    setUpdatingLike: (courseId: string, isUpdating: boolean) => {
        set((state) => ({
            isUpdatingLikeByCourseId: {
                ...state.isUpdatingLikeByCourseId,
                [courseId]: isUpdating,
            },
        }))
    },


    clearUserCourseById: () =>
        set({
            userCourseByCourseId: {}
        })
}))