"use client";

import { create } from "zustand";
import { CProgressStore, CProgress, CLessonProgress } from "@/types/client";
import axios from "axios";



export const useProgressStore = create<CProgressStore>(
    (set, get) => ({
        progressByCourse: {},
        progressByLessons: {} as Record<string, CLessonProgress[]>,
        loadingByCourse: {},
        loadingLessonsProgress: {},

        fetchCourseProgress: async (courseId: string) => {
            const existingProgress =
                get().progressByCourse[courseId];

            const existingLessonsProgress =
                get().progressByLessons[courseId];
            // Already fetched
            if (existingProgress) {
                return;
            }

            if (existingLessonsProgress) {
                return;
            }

            // Already fetching
            if (get().loadingByCourse[courseId]) {
                return;
            }
            if (get().loadingLessonsProgress[courseId]) {
                return;
            }

            set((state) => ({
                loadingByCourse: {
                    ...state.loadingByCourse,
                    [courseId]: true,
                },
                loadingLessonsProgress: {
                    ...state.loadingLessonsProgress,
                    [courseId]: true,
                },
            }));

            try {
                // const response = await axios.get(
                //     `/api/progress/${courseId}`
                // );
                const [progressResponse,progressLessonResponse] = await Promise.all([
                    await axios.get(
                    `/api/progress/${courseId}`
                ),
                await axios.get(
                    `/api/progress/lessons/${courseId}`
                ),
                   
                ])

                set((state) => ({
                    progressByCourse: {
                        ...state.progressByCourse,
                        [courseId]: progressResponse.data.courseProgress,
                    },
                    progressByLessons: {
                        ...state.progressByLessons,
                        [courseId]: progressLessonResponse.data.userLessonsProgress,
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
        setLessonsProgress: (
            courseId: string,
            userLessonsProgress: CLessonProgress[]
        ) =>
            set((state) => ({
                progressByLessons: {
                    ...state.progressByLessons,
                    [courseId]: userLessonsProgress,
                },
            })),

            //To be complete
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