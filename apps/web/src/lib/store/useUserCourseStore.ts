"use client";

import { create } from "zustand";
import axios from "axios";
import { CCourse, CUserCourse } from "@/types/client";
import { clientLogger } from "@/utils/logger/clientLogger";

type CUserCourseStore = {
    cachedLikedCurrentPageNumber: number;
    cachedLikedTotalPages: number;
    cachedLikedHasNextPage: boolean;
    cachedLikedHasPrevPage: boolean;
    cachedLikedTotalCourses: number;
    cachedLikedCourses: CCourse[];
    userCourseByCourseId: Record<string, CUserCourse>;
    isLoading: boolean;
    fetchUserCourseById: (courseId: string,) => Promise<void>;
    setUserCourseById: (
        courseId: string,
        userCourse: CUserCourse
    ) => void;
    enrolledCourseIds: Set<string>;
    likedCourseIds: Set<string>;
    getUserCourseById: (courseId: string) => CUserCourse | null;
    updateUserCourse: (courseId: string, updates: Partial<CUserCourse>) => void;
    fetchUserCoursesByIds: (courseIds: string[]) => Promise<void>;
    fetchAllUserCoursesByUserIds: (userId: string) => Promise<void>;
    fetchUserLikedCourses: ({ page, itemsPerPage }: { page: number; itemsPerPage: number }) => Promise<{ likedCourses: CCourse[], currentPage: number, hasNextPage: boolean, hasPrevPage: boolean, totalPages: number, totalCourses: number }>;
    setUserLikedCourses: (paginatedLikedCourses: CCourse[], newHasNextPage: boolean, newHasPrevPage: boolean, newCurrentPageNumber: number, newTotalPages: number, newTotalCourses: number) => void;
    setAllUserCoursesByUserIds: (userCourses: CUserCourse[]) => void;
    isUpdatingLikeByCourseId: Record<string, boolean>;
    setUpdatingLike: (courseId: string, state: boolean) => void;
    clearUserCourseById: () => void;
};
export const useUserCourseStore = create<CUserCourseStore>((set, get) => ({
    userCourseByCourseId: {},
    cachedLikedCurrentPageNumber: 1,
    cachedLikedTotalPages: 1,
    cachedLikedHasNextPage: false,
    cachedLikedHasPrevPage: false,
    cachedLikedTotalCourses: 0,
    cachedLikedCourses: [] as CCourse[],
    isUpdatingLikeByCourseId: {},
    enrolledCourseIds: new Set(),
    likedCourseIds: new Set(),
    isLoading: false,

    fetchUserCourseById: async (courseId: string) => {
        try {
            const response = await axios.get(`/api/userCourse/${courseId}`);
            const userCourse = response.data.userCourse as CUserCourse;
            set((state: CUserCourseStore) => ({
                userCourseByCourseId: {
                    ...state.userCourseByCourseId,
                    [courseId]: userCourse,
                },
            }));
            clientLogger.info("Single user course fetched successfully");
        } catch (error: unknown) {
            let message = "Something went wrong";
            if (axios.isAxiosError(error)) {
                message =
                    error.response?.data?.message ||
                    error.message ||
                    message;
            } else if (error instanceof Error) {
                message = error.message;
            }
            clientLogger.error("Error fetching single user course", { message, error });
            // toast.error("Something went wrong!");
        }
    },
    fetchUserCoursesByIds: async (courseIds: string[]) => {
        if (courseIds.length === 0) return;
        try {
            const response = await axios.post("/api/userCourse/batch", { courseIds });
            const userCourses = response.data.userCourses as CUserCourse[];
            set((state: CUserCourseStore) => {
                const updated = { ...state.userCourseByCourseId };
                userCourses.forEach((userCourse) => {
                    updated[userCourse.courseId] = userCourse;
                });
                return {
                    userCourseByCourseId: updated,
                };
            });
            clientLogger.info("Batch user courses fetched successfully");
        } catch (error: unknown) {
            let message = "Something went wrong,in user Course Store(batch)";
            if (axios.isAxiosError(error)) {
                message =
                    error.response?.data?.message ||
                    error.message ||
                    message;
            } else if (error instanceof Error) {
                message = error.message;
            }
            clientLogger.error("Error fetching batch user courses", { message, error });
            // toast.error("Something went wrong!");
        }
    },

    fetchAllUserCoursesByUserIds: async (userId: string) => {
        try {
            const response = await axios.get(`/api/userCourse?userId=${userId}`);
            const userCourses = response.data.data as CUserCourse[];
            set((state: CUserCourseStore) => {
                const updated = { ...state.userCourseByCourseId };
                const enrolledCourseIds = new Set<string>();
                const likedCourseIds = new Set<string>();
                userCourses.forEach((userCourse) => {
                    updated[userCourse.courseId] = userCourse;
                    if (userCourse.isEnrolled) {
                        enrolledCourseIds.add(userCourse.courseId);
                    }
                    if (userCourse.isLiked) {
                        likedCourseIds.add(userCourse.courseId);
                    }
                });
                return {
                    userCourseByCourseId: updated,
                    enrolledCourseIds,
                    likedCourseIds

                };
            });

        } catch (error: unknown) {
            let message = "Something went wrong,in user Course Store(batch)";
            if (axios.isAxiosError(error)) {
                message =
                    error.response?.data?.message ||
                    error.message ||
                    message;
            } else if (error instanceof Error) {
                message = error.message;
            }
            clientLogger.error("Error fetching batch user courses", { message, error });
            // toast.error("Something went wrong!");
        }

    },
    fetchUserLikedCourses: async ({ page, itemsPerPage, }: { page: number; itemsPerPage: number }): Promise<{ likedCourses: CCourse[], currentPage: number, hasNextPage: boolean, hasPrevPage: boolean, totalPages: number, totalCourses: number }> => {
        set({ isLoading: true })
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: itemsPerPage.toString(),
            });
            const response = await axios.get(
                `/api/likeCourse?${params.toString()}`
            );
            const { likedCourses, currentPage, totalPages, hasNextPage, hasPrevPage, totalCourses } = response.data;
            const paginatedLikedCourses = likedCourses;
            get().setUserLikedCourses(paginatedLikedCourses, hasNextPage, hasPrevPage, currentPage, totalPages, totalCourses);
            // set({
            //     cachedLikedCurrentPageNumber: currentPage,
            //     cachedLikedTotalPages: totalPages,
            //     cachedLikedHasNextPage: hasNextPage,
            //     cachedLikedHasPrevPage: hasPrevPage,
            // });
            return {
                likedCourses,
                currentPage,
                hasNextPage,
                hasPrevPage,
                totalPages,
                totalCourses
            };
            // return;
        }
        catch (error: unknown) {
            let message = "Something went wrong";
            if (axios.isAxiosError(error)) {
                message =
                    error.response?.data?.message ||
                    error.message ||
                    message;
            } else if (error instanceof Error) {
                message = error.message;
            }
            clientLogger.error("Failed to fetch paginated courses", { message });
            return { likedCourses: [], currentPage: 1, hasNextPage: false, hasPrevPage: false, totalPages: 1, totalCourses: 0 };
        } finally {
            set({ isLoading: false })
        }

    },
    setUserLikedCourses: (paginatedLikedCourses, newHasNextPage, newHasPrevPage, newCurrentPageNumber, newTotalPages, newTotalCourses): void =>
        set({
            cachedLikedCourses: paginatedLikedCourses,
            cachedLikedHasNextPage: newHasNextPage,
            cachedLikedHasPrevPage: newHasPrevPage,
            cachedLikedCurrentPageNumber: newCurrentPageNumber,
            cachedLikedTotalPages: newTotalPages,
            cachedLikedTotalCourses: newTotalCourses


        }),
    setAllUserCoursesByUserIds: (userCourses: CUserCourse[]) => {
        set((state: CUserCourseStore) => {
            const updated = { ...state.userCourseByCourseId };
            const enrolledCourseIds: Set<string> = new Set<string>();
            const likedCourseIds: Set<string> = new Set<string>();

            userCourses.forEach((userCourse) => {
                updated[userCourse.courseId] = userCourse;
                if (userCourse.isEnrolled) enrolledCourseIds.add(userCourse.courseId);
                if (userCourse.isLiked) likedCourseIds.add(userCourse.courseId);
            });

            return {
                userCourseByCourseId: updated,
                enrolledCourseIds,
                likedCourseIds,
            };
        });
    },
    setUserCourseById: (courseId, userCourse: CUserCourse) =>
        set((state: CUserCourseStore) => {
            const enrolledCourseIds = new Set(state.enrolledCourseIds);
            const likedCourseIds = new Set(state.likedCourseIds);

            userCourse.isEnrolled
                ? enrolledCourseIds.add(courseId)
                : enrolledCourseIds.delete(courseId);
            userCourse.isLiked
                ? likedCourseIds.add(courseId)
                : likedCourseIds.delete(courseId);

            return {
                userCourseByCourseId: {
                    ...state.userCourseByCourseId,
                    [courseId]: userCourse,
                },
                enrolledCourseIds,
                likedCourseIds,
            };
        }),
    getUserCourseById: (courseId) => get().userCourseByCourseId[courseId] ?? null,
    updateUserCourse: (courseId: string, updates) => {
        set((state: CUserCourseStore) => {
            const current = state.userCourseByCourseId[courseId];
            if (!current) return state;
            const nextUserCourse = { ...current, ...updates };
            const enrolledCourseIds = new Set(state.enrolledCourseIds);
            const likedCourseIds = new Set(state.likedCourseIds);

            nextUserCourse.isEnrolled
                ? enrolledCourseIds.add(courseId)
                : enrolledCourseIds.delete(courseId);
            nextUserCourse.isLiked
                ? likedCourseIds.add(courseId)
                : likedCourseIds.delete(courseId);

            return {
                userCourseByCourseId: {
                    ...state.userCourseByCourseId,
                    [courseId]: nextUserCourse,
                },
                enrolledCourseIds,
                likedCourseIds,
            };
        })
    },
    setUpdatingLike: (courseId: string, isUpdating: boolean) => {
        set((state) => ({
            isUpdatingLikeByCourseId: {
                ...state.isUpdatingLikeByCourseId,
                [courseId]: isUpdating,
            },
        }));
    },


    clearUserCourseById: () =>
        set({
            userCourseByCourseId: {},
            enrolledCourseIds: new Set(),
            likedCourseIds: new Set(),
        })
}))