"use client";

import { create} from "zustand";
import { CProgressStore, CProgress } from "@/types/client";
import axios from "axios";


export const useProgressStore = create<CProgressStore>(
    (set, get) => ({
        progressByCourse: {},
        loadingByCourse: {},

        fetchCourseProgress: async (courseId: string) => {
            const existingProgress =
                get().progressByCourse[courseId];

            // Already fetched
            if (existingProgress) {
                return;
            }

            // Already fetching
            if (get().loadingByCourse[courseId]) {
                return;
            }

            set((state) => ({
                loadingByCourse: {
                    ...state.loadingByCourse,
                    [courseId]: true,
                },
            }));

            try {
                const response = await axios.get(
                    `/api/progress/${courseId}`
                );

                set((state) => ({
                    progressByCourse: {
                        ...state.progressByCourse,
                        [courseId]: response.data.courseProgress,
                    },
                }));
            } catch (error: unknown) {
                console.error(
                    "Failed to fetch course progress",
                    error
                );
            } finally {
                set((state) => ({
                    loadingByCourse: {
                        ...state.loadingByCourse,
                        [courseId]: false,
                    },
                }));
            }
        },

        setCourseProgress: (
            courseId: string,
            progress: CProgress
        ) =>
            set((state) => ({
                progressByCourse: {
                    ...state.progressByCourse,
                    [courseId]: progress,
                },
            })),

        isLessonCompleted: (
            courseId: string,
            lessonId: string
        ) => {
            const courseProgress =
                get().progressByCourse[courseId];

            return (
                courseProgress?.completedLessonIds.includes(
                    lessonId
                ) ?? false
            );
        },

        markLessonCompleted: (
            courseId: string,
            lessonId: string
        ) =>
            set((state) => {
                const current =
                    state.progressByCourse[courseId];

                if (!current) return state;

                if (
                    current.completedLessonIds.includes(
                        lessonId
                    )
                ) {
                    return state;
                }

                return {
                    progressByCourse: {
                        ...state.progressByCourse,

                        [courseId]: {
                            ...current,

                            completedLessonIds: [
                                ...current.completedLessonIds,
                                lessonId,
                            ],

                            progress: current.progress
                                ? {
                                    ...current.progress,

                                    completedLessonsCount:
                                        current.progress
                                            .completedLessonsCount + 1,
                                }
                                : null,
                        },
                    },
                };
            }),

        markLessonIncomplete: (
            courseId: string,
            lessonId: string
        ) =>
            set((state) => {
                const current =
                    state.progressByCourse[courseId];

                if (!current) return state;

                if (
                    !current.completedLessonIds.includes(
                        lessonId
                    )
                ) {
                    return state;
                }

                return {
                    progressByCourse: {
                        ...state.progressByCourse,

                        [courseId]: {
                            ...current,

                            completedLessonIds:
                                current.completedLessonIds.filter(
                                    (id: string) => id !== lessonId
                                ),

                            progress: current.progress
                                ? {
                                    ...current.progress,

                                    completedLessonsCount:
                                        Math.max(
                                            0,
                                            current.progress
                                                .completedLessonsCount - 1
                                        ),
                                }
                                : null,
                        },
                    },
                };
            }),

        clearCourseProgress: (courseId: string) =>
            set((state) => {
                const {
                    [courseId]: _,
                    ...remaining
                } = state.progressByCourse;

                return {
                    progressByCourse: remaining,
                };
            }),
    })
);